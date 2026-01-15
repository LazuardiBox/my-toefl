import { normalizePath } from 'vite'
import type { Plugin } from 'vite'
import { rootRouteId } from '@tanstack/router-core'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export type ManifestRoute = {
  filePath: string
  children: Array<string>
}

function collectPageRouteFiles(dir: string): Array<string> {
  if (!fs.existsSync(dir)) {
    return []
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: Array<string> = []

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectPageRouteFiles(entryPath))
      continue
    }

    if (/^[A-Z][A-Za-z0-9]*Route\.tsx$/.test(entry.name)) {
      files.push(entryPath)
    }
  }

  return files
}

function collectApiRouteFiles(dir: string): Array<string> {
  if (!fs.existsSync(dir)) {
    return []
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: Array<string> = []

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectApiRouteFiles(entryPath))
      continue
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(entryPath)
    }
  }

  return files
}

function resolveScriptKind(filePath: string) {
  if (filePath.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (filePath.endsWith('.ts')) return ts.ScriptKind.TS
  if (filePath.endsWith('.jsx')) return ts.ScriptKind.JSX
  return ts.ScriptKind.JS
}

function resolveImportPath(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) {
    return null
  }

  const basePath = path.resolve(path.dirname(fromFile), specifier)
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.jsx'),
    path.join(basePath, 'index.mjs'),
    path.join(basePath, 'index.cjs'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

function collectExportedConstStrings(
  filePath: string,
  cache: Map<string, Map<string, string>>,
  visiting: Set<string>,
): Map<string, string> {
  if (cache.has(filePath)) {
    return cache.get(filePath) as Map<string, string>
  }
  if (visiting.has(filePath)) {
    return new Map()
  }
  if (!fs.existsSync(filePath)) {
    return new Map()
  }

  visiting.add(filePath)
  const source = fs.readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    resolveScriptKind(filePath),
  )

  const exported = new Map<string, string>()
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue
    }
    const isExported =
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ) ?? false
    const isConst =
      (statement.declarationList.flags & ts.NodeFlags.Const) ===
      ts.NodeFlags.Const
    if (!isExported || !isConst) {
      continue
    }
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) {
        continue
      }
      if (ts.isStringLiteral(decl.initializer)) {
        exported.set(decl.name.text, decl.initializer.text)
      } else if (ts.isNoSubstitutionTemplateLiteral(decl.initializer)) {
        exported.set(decl.name.text, decl.initializer.text)
      }
    }
  }

  cache.set(filePath, exported)
  visiting.delete(filePath)
  return exported
}

function extractRoutePath(
  filePath: string,
  source: string,
  exportCache: Map<string, Map<string, string>>,
): string | null {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    resolveScriptKind(filePath),
  )

  const constStrings = new Map<string, string>()
  const importedStrings = new Map<string, string>()

  const collectConstStrings = (node: ts.Node) => {
    if (ts.isVariableStatement(node)) {
      const isConst =
        (node.declarationList.flags & ts.NodeFlags.Const) === ts.NodeFlags.Const
      if (isConst) {
        for (const decl of node.declarationList.declarations) {
          if (!ts.isIdentifier(decl.name) || !decl.initializer) {
            continue
          }
          if (ts.isStringLiteral(decl.initializer)) {
            constStrings.set(decl.name.text, decl.initializer.text)
          } else if (ts.isNoSubstitutionTemplateLiteral(decl.initializer)) {
            constStrings.set(decl.name.text, decl.initializer.text)
          }
        }
      }
    }
    ts.forEachChild(node, collectConstStrings)
  }

  const collectImportedStrings = (node: ts.Node) => {
    if (!ts.isImportDeclaration(node)) {
      ts.forEachChild(node, collectImportedStrings)
      return
    }

    if (!ts.isStringLiteral(node.moduleSpecifier)) {
      return
    }

    const importClause = node.importClause
    if (!importClause?.namedBindings || !ts.isNamedImports(importClause.namedBindings)) {
      return
    }

    const resolvedImport = resolveImportPath(
      filePath,
      node.moduleSpecifier.text,
    )
    if (!resolvedImport) {
      return
    }

    const exported = collectExportedConstStrings(
      resolvedImport,
      exportCache,
      new Set<string>(),
    )
    for (const specifier of importClause.namedBindings.elements) {
      const importedName = specifier.propertyName?.text ?? specifier.name.text
      const localName = specifier.name.text
      const value = exported.get(importedName)
      if (value !== undefined) {
        importedStrings.set(localName, value)
      }
    }
  }

  const resolveExpressionToString = (expr: ts.Expression): string | null => {
    if (ts.isStringLiteral(expr)) {
      return expr.text
    }
    if (ts.isNoSubstitutionTemplateLiteral(expr)) {
      return expr.text
    }
    if (ts.isIdentifier(expr)) {
      return (
        constStrings.get(expr.text) ??
        importedStrings.get(expr.text) ??
        null
      )
    }
    if (ts.isTemplateExpression(expr)) {
      let result = expr.head.text
      for (const span of expr.templateSpans) {
        const spanValue = resolveExpressionToString(span.expression)
        if (spanValue === null) {
          return null
        }
        result += spanValue + span.literal.text
      }
      return result
    }
    return null
  }

  collectConstStrings(sourceFile)
  collectImportedStrings(sourceFile)

  let found: string | null = null

  const visit = (node: ts.Node) => {
    if (found) {
      return
    }

    if (ts.isCallExpression(node)) {
      const callee =
        ts.isIdentifier(node.expression) ? node.expression.text : null

      if (
        callee === 'pageRoute' ||
        callee === 'definePageRoute' ||
        callee === 'createRoute'
      ) {
        const [arg] = node.arguments
        if (arg && ts.isObjectLiteralExpression(arg)) {
          for (const prop of arg.properties) {
            if (!ts.isPropertyAssignment(prop)) {
              continue
            }
            if (!ts.isIdentifier(prop.name) || prop.name.text !== 'path') {
              continue
            }
            const resolved = resolveExpressionToString(prop.initializer)
            if (resolved !== null) {
              found = resolved
              return
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return found
}

export function customRoutesManifestPlugin(): Plugin {
  let resolvedRoot = process.cwd()

  return {
    name: 'custom-routes-manifest',
    enforce: 'pre' as const,
    apply: 'build' as const,
    applyToEnvironment: (env: { name: string }) => env.name === 'ssr',
    configResolved(config: { root: string }) {
      resolvedRoot = config.root
    },
    buildStart() {
      const srcDir = path.resolve(resolvedRoot, 'src')
      const pagesDir = path.resolve(srcDir, 'client', 'pages')
      const apiRoutesDir = path.resolve(resolvedRoot, 'routers')
      const rootRouteFile = path.resolve(resolvedRoot, 'routers', 'layout.tsx')

      const routesManifest: Record<string, ManifestRoute> = {
        [rootRouteId]: {
          filePath: normalizePath(rootRouteFile),
          children: [],
        },
      }

      const pageFiles = collectPageRouteFiles(pagesDir)
      const apiFiles = collectApiRouteFiles(apiRoutesDir)
      const exportCache = new Map<string, Map<string, string>>()
      const routeIds: Array<string> = []

      for (const filePath of [...pageFiles, ...apiFiles]) {
        const source = fs.readFileSync(filePath, 'utf8')
        const routePath = extractRoutePath(filePath, source, exportCache)
        if (!routePath) {
          continue
        }

        const routeId = routePath
        routeIds.push(routeId)
        routesManifest[routeId] = {
          filePath: normalizePath(filePath),
          children: [],
        }
      }

      routesManifest[rootRouteId].children = routeIds
      ;(globalThis as { TSS_ROUTES_MANIFEST?: Record<string, ManifestRoute> }).TSS_ROUTES_MANIFEST =
        routesManifest
    },
  }
}

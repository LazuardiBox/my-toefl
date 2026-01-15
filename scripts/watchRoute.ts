import { existsSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import chokidar from "chokidar";

const PAGES_DIR = join(process.cwd(), "src/client/pages");

if (!existsSync(PAGES_DIR)) {
  console.error(`Directory ${PAGES_DIR} does not exist!`);
  process.exit(1);
}

// Helper to convert PascalCase or camelCase to kebab-case or path segments
function toPath(filename: string): string {
  // Remove 'Route.tsx' or just extension
  const base = filename.replace(/Route\.tsx$/, "").replace(/\.tsx$/, "");

  // Handle index
  if (base.toLowerCase() === "index") return "";

  // Convert camelCase/PascalCase to kebab-case if needed,
  // but for now, let's keep it simple: lowercase
  // about -> about
  // userProfile -> user-profile (optional, but standard usually keeps case or lower)
  // Let's just lowercase it for the URL path
  return base.toLowerCase();
}

function generateContent(relativePath: string, filename: string) {
  // Remove extension
  const baseName = filename.replace(/\.tsx$/, "");

  // Filename is ALREADY validated to be PascalCaseRoute.tsx
  const routeName = baseName;
  const dir = dirname(relativePath);

  // Build URL path
  const pathSegments = dir.split(sep).filter((p) => p !== "." && p !== "");
  const fileSegment = toPath(filename);
  if (fileSegment) pathSegments.push(fileSegment);

  const urlPath = `/${pathSegments.join("/")}`;

  return `import { PageRoute } from '@/routers'

export const ${routeName} = PageRoute({
    path: '${urlPath}',
    component: ${routeName}Component,
    title: '${routeName.replace("Route", "")}',
})

function ${routeName}Component() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">${routeName}</h1>
        </div>
    )
}
`;
}

function handleFile(filePath: string) {
  const relativePath = relative(PAGES_DIR, filePath);

  // 1. MUST end with Route.tsx
  // 2. MUST start with Uppercase (PascalCase)
  // 3. MUST NOT contain hyphens or spaces (Strict PascalCase)
  const fileName = basename(relativePath);
  if (!/^[A-Z][a-zA-Z0-9]*Route\.tsx$/.test(fileName)) return;

  try {
    if (!existsSync(filePath)) return;

    const stats = statSync(filePath);
    if (stats.size > 0) return;

    const content = generateContent(relativePath, fileName);
    writeFileSync(filePath, content);
  } catch (err) {
    console.error("Error processing file:", err);
  }
}

const watcher = chokidar.watch(PAGES_DIR, {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 50,
    pollInterval: 10,
  },
});

watcher.on("add", handleFile);

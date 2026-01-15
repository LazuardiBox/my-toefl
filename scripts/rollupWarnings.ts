import type { RollupLog } from 'rollup'

type WarningHandler = (
  warning: RollupLog,
  warn: (warning: RollupLog) => void,
) => void

export function filterTanStackUnusedImports(): WarningHandler {
  return (warning, warn) => {
    if (
      warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
      typeof warning.message === 'string' &&
      warning.message.includes('node_modules/@tanstack/start-') &&
      warning.message.includes('never used')
    ) {
      return
    }

    warn(warning)
  }
}

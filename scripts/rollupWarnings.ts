import type { RollupLog } from "rollup";

type WarningHandler = (
  warning: RollupLog,
  warn: (warning: RollupLog) => void,
) => void;

export function filterTanStackUnusedImports(): WarningHandler {
  return (warning, warn) => {
    if (
      warning.code === "MODULE_LEVEL_DIRECTIVE" ||
      (typeof warning.message === "string" &&
        warning.message.includes(
          "Module level directives cause errors when bundled",
        ))
    ) {
      return;
    }

    if (
      warning.code === "MODULE_LEVEL_DIRECTIVE" &&
      typeof warning.message === "string" &&
      warning.message.includes('"use client"')
    ) {
      return;
    }

    if (
      (warning.code === "UNUSED_EXTERNAL_IMPORT" ||
        warning.message.includes("never used")) &&
      typeof warning.message === "string" &&
      warning.message.includes("node_modules/@tanstack/")
    ) {
      return;
    }

    warn(warning);
  };
}

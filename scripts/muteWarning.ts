import type { Plugin } from "vite";

export const muteWarningsPlugin = (warningCodes: string[]): Plugin => {
  const mutedMessages = new Map();

  return {
    name: "mute-warnings",
    enforce: "pre",
    config: () => ({
      build: {
        rollupOptions: {
          onwarn(warning, defaultHandler) {
            const code = warning.code;

            if (code) {
              if (warningCodes.includes(code) && !mutedMessages.has(code)) {
                mutedMessages.set(code, {
                  exMsg: warning.message,
                });
              }

              if (mutedMessages.has(code)) {
                return;
              }
            }

            defaultHandler(warning);
          },
        },
      },
    }),
    closeBundle() {
      this.warn(
        "Some of your muted warnings never appeared during the build process:",
      );
      for (const [key, item] of mutedMessages) {
        this.warn(`\t(${key} example): ${item.exMsg}`);
      }
    },
  };
};

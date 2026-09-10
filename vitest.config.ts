import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The repository tests never touch CSS; give Vite an explicit empty PostCSS
  // config so it doesn't try to parse the Tailwind v4 `postcss.config.mjs`.
  css: { postcss: { plugins: [] } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    css: false,
  },
  resolve: {
    alias: [
      {
        find: /^@\/(.*)$/,
        replacement: fileURLToPath(new URL("./src/$1", import.meta.url)),
      },
      {
        // three.js / Next mark modules server-only; the repository tests run in
        // plain Node, so neutralise that guard.
        find: "server-only",
        replacement: fileURLToPath(
          new URL("./src/test/server-only-stub.ts", import.meta.url),
        ),
      },
    ],
  },
});

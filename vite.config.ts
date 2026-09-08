import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignore: ["**/dist/**", "**/.nuxt/**", "**/.output/**", "**/web-types.json"],
  },
  lint: {
    options: { typeAware: false, typeCheck: false },
    ignorePatterns: ["**/dist/**", "**/.nuxt/**", "**/.output/**"],
  },
});

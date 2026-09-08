export default defineNuxtConfig({
  compatibilityDate: "2026-09-08",
  modules: ["@nuxt/content", "@shuimo-design/ui/nuxt"],
  devtools: { enabled: true },
  content: {
    experimental: { nativeSqlite: true },
  },
});

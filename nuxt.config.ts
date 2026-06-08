export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  devtools: { enabled: false },
  css: ['~/assets/css/tailwind.css'],
  ssr: false,
  app: {
    head: {
      title: 'EGAT Maintenance Dashboard',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  runtimeConfig: {
    googleSheetId: process.env.GOOGLE_SHEET_ID,
    googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY,
  },
  compatibilityDate: '2026-06-04',
});

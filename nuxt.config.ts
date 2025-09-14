// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css', '@mdi/font/css/materialdesignicons.css'],
  modules: ['vuetify-nuxt-module'],
  pages: true,
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              primary: '#4338ca', // indigo-600
            }
          },
          dark: {
            dark: true,
            colors: {
              primary: '#6366f1', // indigo-500
            }
          }
        }
      }
    }
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})

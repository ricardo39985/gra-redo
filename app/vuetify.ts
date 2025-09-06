import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin(nuxtApp => {
    const vuetify = createVuetify({
        ssr: true,
        components,
        directives,
        theme: {
            themes: {
                light: {
                    dark: false,
                    colors: {
                        primary: '#4f46e5',
                        'primary-darken-1': '#4338ca',
                        secondary: '#14b8a6',
                        background: '#f8fafc',
                        surface: '#ffffff',
                        'surface-variant': '#f1f5f9',
                        error: '#ef4444',
                        info: '#3b82f6',
                        success: '#22c55e',
                        warning: '#f97316',
                    },
                },
                dark: {
                    dark: true,
                    colors: {
                        primary: '#818cf8',
                        'primary-darken-1': '#6366f1',
                        secondary: '#5eead4',
                        background: '#020617',
                        surface: '#0f172a',
                        'surface-variant': '#1e293b',
                        error: '#f87171',
                        info: '#60a5fa',
                        success: '#4ade80',
                        warning: '#fb923c',
                    },
                },
            },
        },
    })

    nuxtApp.vueApp.use(vuetify)
})
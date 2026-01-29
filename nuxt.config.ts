import tailwindcss from '@tailwindcss/vite'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
  },

  components: [
    {
      path: '~/components',
      extensions: ['.vue'],
    },
  ],

  modules: ['shadcn-nuxt', '@vueuse/nuxt', '@nuxt/icon'],

  // Apply the persisted theme class (dark/light) before hydration to prevent flicker.
  // This runs as an inline <script> in <head>.
  app: {
    head: {
      script: [
        {
          // Unhead uses `innerHTML` for inline scripts in config.
          innerHTML: `(() => {
            try {
              var key = 'theme-mode';
              var stored = localStorage.getItem(key);
              var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              var mode = (stored === 'light' || stored === 'dark') ? stored : (prefersDark ? 'dark' : 'light');
              var root = document.documentElement;
              root.classList.toggle('dark', mode === 'dark');
              root.classList.toggle('light', mode === 'light');
            } catch (e) {}
          })();`,
        },
      ],
    },
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "~/components/ui"
     */
    componentDir: '~/components/ui',
  },

  imports: {
    dirs: ['./lib'],
  },
  compatibilityDate: '2025-07-15',
})

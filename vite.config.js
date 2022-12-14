import { defineConfig, resolveBaseUrl } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import preprocess from "svelte-preprocess";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      preprocess: preprocess(),
    }),
    VitePWA({
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/rsms\.me\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        skipWaiting: true,
      },
      manifest: {
        name: "miq",
        short_name: "miq",
        description: "Preview and fire mic cues from Google Sheets",
        theme_color: "#000000",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
        display: "standalone",
        start_url: "/",
      },
    }),
  ],
});

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
      },
    }),
  ],
});

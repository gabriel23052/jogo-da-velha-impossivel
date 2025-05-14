import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig({
  plugins: [
    createHtmlPlugin(),
    ViteImageOptimizer({
      webp: {
        quality: 85,
      },
    }),
  ],
});

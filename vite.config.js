import tailwind from "@tailwindcss/vite";
import vuePlugin from "@vitejs/plugin-vue";
import { join } from "path";

import { defineConfig } from "vite";

/**
 * https://vitejs.dev/config
 */
const config = defineConfig({
  root: join(__dirname, "src/renderer/"),
  publicDir: "public",
  server: {
    port: 8080,
  },
  open: false,
  build: {
    outDir: join(import.meta.dirname, "build/renderer"),
    emptyOutDir: true,
  },
  plugins: [vuePlugin(), tailwind()],
  resolve: {
    alias: {
      "@": join(import.meta.dirname, "src/renderer/"),
    },
  },
});

export default config;

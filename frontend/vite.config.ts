import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../packages/shared/src"),
    },
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});

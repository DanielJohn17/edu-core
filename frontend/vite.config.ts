import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-framework": [
            "react",
            "react-dom",
            "react-router",
            "@refinedev/core",
            "@refinedev/react-router",
          ],
          "vendor-table": ["@refinedev/react-table", "@tanstack/react-table"],
          "vendor-ui": [
            "lucide-react",
            "sonner",
            "clsx",
            "tailwind-merge",
          ],
        },
      },
    },
  },
});

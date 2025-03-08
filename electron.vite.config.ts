import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@": resolve("src/renderer/src"),
      },
    },
    plugins: [
      TanStackRouterVite({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "src/renderer/src/routes",
        generatedRouteTree: "src/renderer/src/routeTree.gen.ts",
        quoteStyle: "double",
      }),
      react(),
      tailwindcss(),
    ],
  },
});

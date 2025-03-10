import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@": resolve("src/main/src"),
        "@features": resolve("src/features"),
        "@core": resolve("src/core"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@": resolve("src/preload/src"),
        "@features": resolve("src/features"),
        "@core": resolve("src/core"),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@": resolve("src/renderer/src"),
        "@features": resolve("src/features"),
        "@core": resolve("src/core"),
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

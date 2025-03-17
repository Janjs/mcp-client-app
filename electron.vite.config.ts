import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "./out/backend",
      lib: {
        entry: "./src/backend/src/index.ts",
      },
    },
    resolve: {
      alias: {
        "@": resolve("src/backend/src"),
        "@features": resolve("src/features"),
        "@core": resolve("src/core"),
        "@backend": resolve("src/backend/src"),
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
    root: "src/frontend",
    build: {
      outDir: "./out/frontend",
      rollupOptions: {
        input: {
          main: resolve("src/frontend/index.html"),
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve("src/frontend/src"),
        "@features": resolve("src/features"),
        "@core": resolve("src/core"),
      },
    },
    plugins: [
      TanStackRouterVite({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "src/frontend/src/routes",
        generatedRouteTree: "src/frontend/src/routeTree.gen.ts",
        quoteStyle: "double",
      }),
      react(),
      tailwindcss(),
    ],
  },
});

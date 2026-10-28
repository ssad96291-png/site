import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { legacyImageReplacement } from "./server/media-assets";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "legacy-image-compatibility",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const replacement = legacyImageReplacement(
            (req.url || "").split("?")[0],
          );
          if (!replacement) return next();
          res.writeHead(302, { Location: replacement });
          res.end();
        });
      },
    },
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3000",
      "/uploads": "http://127.0.0.1:3000",
    },
  },
});

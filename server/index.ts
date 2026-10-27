import { createApp } from "./app.js";
const port = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === "production";
const app = createApp({
  production,
  staticDir: production ? "dist" : undefined,
});
const server = app.listen(port, process.env.APP_HOST || "0.0.0.0", () =>
  console.log(
    `Kılınç server listening on port ${port}. Admin bootstrap details: .data/initial-admin-password (or configured ADMIN_PASSWORD).`,
  ),
);
function shutdown() {
  server.close(() => {
    app.locals.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

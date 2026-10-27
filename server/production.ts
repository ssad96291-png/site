// Cross-platform equivalent of NODE_ENV=production (also works in Windows cmd).
process.env.NODE_ENV = "production";
await import("./index.js");

export {};

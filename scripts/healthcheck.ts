// Docker HEALTHCHECK script
// Exits 0 if the server responds OK, exits 1 otherwise

import { request } from "node:http";

const port = parseInt(process.env["PORT"] ?? "3000", 10);
const timeout = 5000;

const req = request(
  { host: "localhost", port, path: "/health", method: "GET", timeout },
  (res) => {
    if (res.statusCode === 200) {
      process.exit(0);
    } else {
      console.error(`Health check failed: HTTP ${res.statusCode}`);
      process.exit(1);
    }
  },
);

req.on("error", (err) => {
  console.error(`Health check error: ${err.message}`);
  process.exit(1);
});

req.on("timeout", () => {
  console.error("Health check timed out");
  req.destroy();
  process.exit(1);
});

req.end();

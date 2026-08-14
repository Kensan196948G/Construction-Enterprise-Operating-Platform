/**
 * Start the API server with the full fictional demo dataset.
 *
 * Development / prototype review only. Sets CEOP_SEED_RICH_DEMO before the
 * application container reads environment state, then delegates to the
 * regular start script (PORT is honoured the same way).
 */

process.env["CEOP_SEED_RICH_DEMO"] = "true";

await import("./start.ts");

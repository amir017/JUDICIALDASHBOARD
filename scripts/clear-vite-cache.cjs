/* Remove stale Vite dep-optimizer dirs (e.g. after removing a package like d3-voronoi). */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
for (const name of [".vite", ".vite-temp"]) {
  const dir = path.join(root, "node_modules", name);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

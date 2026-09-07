import { copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// GitHub Pages serves static files only, so a deep link such as
// /TravelCompanion/accept-invite/<token> has no matching file and would 404.
// Pages falls back to 404.html for unknown paths, so shipping a copy of
// index.html under that name lets React Router resolve the route client-side.
const distDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");

copyFileSync(resolve(distDir, "index.html"), resolve(distDir, "404.html"));

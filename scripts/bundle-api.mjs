import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

await build({
  entryPoints: [join(root, "server/vercel-entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  outfile: join(root, "api/server.js"),
  alias: {
    "@shared": join(root, "shared"),
  },
  external: ["pg-native"],
  logLevel: "info",
});

console.log("API bundle complete → api/server.js");

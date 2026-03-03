import express from "express";
import path from "path";
import { registerRoutes } from "./routes";

const app = express();

app.use(
  express.json({
    limit: "50mb",
    verify: (req: any, _res, buf) => { req.rawBody = buf; },
  })
);
app.use(express.urlencoded({ extended: false }));

const distPath = path.join(process.cwd(), "dist", "public");

// Serve built frontend static assets
app.use(express.static(distPath));

const initPromise = (async () => {
  await registerRoutes(null as any, app);

  // SPA fallback — must be registered AFTER all API routes
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
})();

export default async function handler(req: any, res: any) {
  await initPromise;
  return app(req, res);
}

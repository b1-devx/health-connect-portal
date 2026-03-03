import express from "express";
import { registerRoutes } from "./routes";

const app = express();

app.use(
  express.json({
    limit: "50mb",
    verify: (req: any, _res, buf) => { req.rawBody = buf; },
  })
);
app.use(express.urlencoded({ extended: false }));

const initPromise = registerRoutes(null as any, app);

export default async function handler(req: any, res: any) {
  await initPromise;
  return app(req, res);
}

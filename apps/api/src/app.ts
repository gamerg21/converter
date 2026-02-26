import express from "express";
import cors from "cors";
import helmet from "helmet";
import { v1Router } from "./routes/v1";
import { jobsRouter } from "./routes/jobs";
import { snapshotMetrics } from "./observability/metrics";
import { checkHealth } from "./observability/health";

export const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.get("/health", async (_req, res) => {
    const health = await checkHealth();
    res.status(health.ok ? 200 : 503).json(health);
  });

  app.get("/metrics", (_req, res) => {
    res.json({ data: snapshotMetrics() });
  });

  app.use("/jobs", jobsRouter);
  app.use("/v1", v1Router);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
};

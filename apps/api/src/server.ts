import { env } from "./config/env";
import { createApp } from "./app";
import { log } from "./observability/logger";

const app = createApp();

app.listen(env.PORT, () => {
  log("info", "API server started", { port: env.PORT });
});

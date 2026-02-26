import "./config/env";
import { startConsumer } from "./queue/consumer";
import { workerLog } from "./observability/logger";

startConsumer();
workerLog("Worker started");

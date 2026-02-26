type Level = "info" | "warn" | "error";

export const log = (level: Level, message: string, metadata?: Record<string, unknown>) => {
  const record = {
    level,
    message,
    metadata,
    time: new Date().toISOString()
  };
  // Structured JSON logs are easier to ingest by systems like Datadog/Loki.
  console.log(JSON.stringify(record));
};

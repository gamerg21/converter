export const workerLog = (message: string, metadata?: Record<string, unknown>) => {
  console.log(
    JSON.stringify({
      service: "worker",
      message,
      metadata,
      time: new Date().toISOString()
    })
  );
};

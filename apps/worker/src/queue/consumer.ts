import { prisma } from "@convertr/db";
import { executeConversion } from "@convertr/conversion-engine";
import { conversionQueue } from "@convertr/shared";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { workerLog } from "../observability/logger";

const POLL_INTERVAL_MS = 1500;
const LOCAL_STORAGE_ROOT = path.resolve(process.cwd(), "../../local-storage");

const runJob = async (
  message: {
    jobId: string;
    organizationId: string;
    inputFileId: string;
    sourceFormat: string;
    targetFormat: string;
  },
  alreadyClaimed: boolean
) => {
  workerLog("Received job", { jobId: message.jobId });

  const inputAsset = await prisma.fileAsset.findUnique({
    where: { id: message.inputFileId }
  });
  if (!inputAsset) {
    await prisma.conversionJob.update({
      where: { id: message.jobId },
      data: {
        status: "FAILED",
        progress: 100,
        errorMessage: "Input file not found.",
        completedAt: new Date()
      }
    });
    return;
  }

  const outputStorageKey = `${message.organizationId}/outputs/${message.jobId}.${message.targetFormat}`;
  const inputPath = path.join(LOCAL_STORAGE_ROOT, inputAsset.storageKey);
  const outputPath = path.join(LOCAL_STORAGE_ROOT, outputStorageKey);
  await mkdir(path.dirname(outputPath), { recursive: true });

  if (!alreadyClaimed) {
    await prisma.conversionJob.update({
      where: { id: message.jobId },
      data: {
        status: "PROCESSING",
        progress: 15,
        startedAt: new Date()
      }
    });
  }

  let result: Awaited<ReturnType<typeof executeConversion>> = {
    success: false,
    error: "Unknown error"
  };
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    result = await executeConversion({
      jobId: message.jobId,
      inputPath,
      outputPath,
      sourceFormat: message.sourceFormat,
      targetFormat: message.targetFormat
    });
    if (result.success) break;

    await prisma.jobTask.updateMany({
      where: { jobId: message.jobId },
      data: {
        retryCount: attempt + 1,
        log: `Retry ${attempt + 1}: ${result.error ?? "unknown error"}`
      }
    });
  }

  if (!result.success) {
    await prisma.conversionJob.update({
      where: { id: message.jobId },
      data: {
        status: "FAILED",
        progress: 100,
        errorMessage: result.error ?? "Unknown conversion failure",
        completedAt: new Date()
      }
    });
    return;
  }

  const outputAsset = await prisma.fileAsset.create({
    data: {
      organizationId: message.organizationId,
      ownerUserId: "00000000-0000-0000-0000-000000000001",
      filename: `${message.jobId}.${message.targetFormat}`,
      mimeType: inputAsset.mimeType || "application/octet-stream",
      sizeBytes: BigInt((await stat(outputPath)).size),
      format: message.targetFormat,
      storageKey: outputStorageKey
    }
  });

  await prisma.conversionJob.update({
    where: { id: message.jobId },
    data: {
      status: "FINISHED",
      progress: 100,
      outputFileId: outputAsset.id,
      completedAt: new Date()
    }
  });
};

const claimNextQueuedJob = async () => {
  const job = await prisma.conversionJob.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      organizationId: true,
      inputFileId: true,
      sourceFormat: true,
      targetFormat: true
    }
  });

  if (!job) {
    return null;
  }

  const claimed = await prisma.conversionJob.updateMany({
    where: {
      id: job.id,
      status: "QUEUED"
    },
    data: {
      status: "PROCESSING",
      progress: 15,
      startedAt: new Date()
    }
  });

  if (claimed.count === 0) {
    return null;
  }

  return {
    jobId: job.id,
    organizationId: job.organizationId,
    inputFileId: job.inputFileId,
    sourceFormat: job.sourceFormat,
    targetFormat: job.targetFormat
  };
};

export const startConsumer = () => {
  conversionQueue.subscribe(async (message) => {
    await runJob(message, false);
  });

  // API and worker run in separate processes in local dev; poll DB for queued jobs.
  setInterval(() => {
    (async () => {
      while (true) {
        const job = await claimNextQueuedJob();
        if (!job) {
          return;
        }
        await runJob(job, true);
      }
    })().catch((error) => workerLog("Polling loop failed", { error: String(error) }));
  }, POLL_INTERVAL_MS);
};

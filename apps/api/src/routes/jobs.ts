import { Router } from "express";
import { prisma } from "@convertr/db";
import { createJobSchema, conversionQueue } from "@convertr/shared";
import { requireAuth } from "../middleware/auth";
import { deliverJobEvent } from "../webhooks/delivery";
import { assertWithinQuota } from "../domain/quotas";
import { recordUsage } from "../usage/metering";
import { buildSignedDownloadUrl } from "../security/uploadPolicy";

export const jobsRouter = Router();

jobsRouter.use(requireAuth);

jobsRouter.get("/", async (req, res) => {
  const jobs = await prisma.conversionJob.findMany({
    where: { organizationId: req.auth!.organizationId },
    select: {
      id: true,
      sourceFormat: true,
      targetFormat: true,
      status: true,
      progress: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  res.json({ data: jobs });
});

jobsRouter.post("/", async (req, res) => {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const file = await prisma.fileAsset.findUnique({
    where: { id: parsed.data.fileAssetId }
  });
  if (!file || file.organizationId !== req.auth!.organizationId) {
    res.status(404).json({ error: "Input file not found." });
    return;
  }

  const quotaCheck = await assertWithinQuota(
    req.auth!.organizationId,
    Number(file.sizeBytes / BigInt(1024 * 1024))
  );
  if (!quotaCheck.allowed) {
    res.status(402).json({ error: quotaCheck.reason });
    return;
  }

  const job = await prisma.conversionJob.create({
    data: {
      organizationId: req.auth!.organizationId,
      inputFileId: parsed.data.fileAssetId,
      sourceFormat: parsed.data.sourceFormat,
      targetFormat: parsed.data.targetFormat,
      status: "QUEUED",
      tasks: {
        create: {
          step: "convert-main",
          status: "QUEUED"
        }
      }
    }
  });

  await conversionQueue.publish({
    jobId: job.id,
    organizationId: job.organizationId,
    inputFileId: job.inputFileId,
    sourceFormat: job.sourceFormat,
    targetFormat: job.targetFormat
  });

  const period = new Date().toISOString().slice(0, 7);
  await recordUsage(req.auth!.organizationId, "jobs.created", 1n, period);
  await deliverJobEvent(job.organizationId, "job.queued", { jobId: job.id });
  res.status(201).json({ data: job });
});

jobsRouter.post("/:id/cancel", async (req, res) => {
  const existing = await prisma.conversionJob.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.organizationId !== req.auth!.organizationId) {
    res.status(404).json({ error: "Job not found." });
    return;
  }

  const updated = await prisma.conversionJob.update({
    where: { id: req.params.id },
    data: {
      status: "CANCELED",
      errorMessage: "Canceled by user."
    }
  });

  await deliverJobEvent(updated.organizationId, "job.canceled", { jobId: updated.id });
  res.json({ data: updated });
});

jobsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.conversionJob.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.organizationId !== req.auth!.organizationId) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (existing.status === "QUEUED" || existing.status === "PROCESSING") {
    res.status(409).json({ error: "Cannot delete an active job." });
    return;
  }

  await prisma.conversionJob.delete({
    where: { id: existing.id }
  });
  res.status(204).send();
});

jobsRouter.delete("/", async (req, res) => {
  const deleted = await prisma.conversionJob.deleteMany({
    where: {
      organizationId: req.auth!.organizationId,
      status: {
        in: ["FINISHED", "FAILED", "CANCELED"]
      }
    }
  });

  res.json({ data: { deletedCount: deleted.count } });
});

jobsRouter.get("/:id/download", async (req, res) => {
  const job = await prisma.conversionJob.findUnique({
    where: { id: req.params.id },
    include: { outputFile: true }
  });
  if (!job || job.organizationId !== req.auth!.organizationId) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (job.status !== "FINISHED" || !job.outputFile) {
    res.status(409).json({ error: "Output not ready." });
    return;
  }
  res.redirect(buildSignedDownloadUrl(job.outputFile.storageKey));
});

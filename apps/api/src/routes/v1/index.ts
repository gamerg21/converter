import { Router } from "express";
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import express from "express";
import { prisma } from "@convertr/db";
import { requireAuth } from "../../middleware/auth";
import { validateUploadPolicy } from "../../security/uploadPolicy";
import { jobsRouter } from "../jobs";
import { getUsageSummary } from "../../usage/metering";
import { createCheckoutSession, reconcileSubscriptionFromWebhook } from "../../billing/stripe";
import { defaultPlanQuotas } from "@convertr/shared";

export const v1Router = Router();
v1Router.use(requireAuth);
v1Router.use("/jobs", jobsRouter);

const LOCAL_STORAGE_ROOT = path.resolve(process.cwd(), "../../local-storage");

v1Router.post("/files/presign", validateUploadPolicy, async (req, res) => {
  const filename = String(req.body?.filename ?? req.header("x-file-name") ?? "upload.bin");
  const format = filename.split(".").pop() ?? "bin";
  const storageKey = `${req.auth!.organizationId}/${crypto.randomUUID()}-${filename}`;

  const fileAsset = await prisma.fileAsset.create({
    data: {
      organizationId: req.auth!.organizationId,
      ownerUserId: req.auth!.userId,
      filename,
      mimeType: String(req.header("content-type") ?? "application/octet-stream"),
      sizeBytes: BigInt(Number(req.header("content-length") ?? req.header("x-file-size") ?? "0")),
      format,
      storageKey
    }
  });

  res.status(201).json({
    data: {
      fileAssetId: fileAsset.id,
      uploadUrl: `http://localhost:4000/v1/files/upload/${encodeURIComponent(storageKey)}`
    }
  });
});

v1Router.post("/files/import-url", async (req, res) => {
  const rawUrl = String(req.body?.url ?? "");
  if (!rawUrl) {
    res.status(400).json({ error: "url is required." });
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "Invalid URL." });
    return;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    res.status(400).json({ error: "Only http/https URLs are supported." });
    return;
  }

  const upstream = await fetch(parsedUrl.toString());
  if (!upstream.ok) {
    res.status(400).json({ error: "Failed to fetch file from URL." });
    return;
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const extFromPath = path.extname(parsedUrl.pathname).replace(".", "");
  const fallbackName = extFromPath ? `url-import.${extFromPath}` : "url-import.bin";
  const filename = decodeURIComponent(path.basename(parsedUrl.pathname || fallbackName)) || fallbackName;
  const format = filename.split(".").pop() ?? "bin";
  const storageKey = `${req.auth!.organizationId}/${crypto.randomUUID()}-${filename}`;
  const content = Buffer.from(await upstream.arrayBuffer());

  const fileAsset = await prisma.fileAsset.create({
    data: {
      organizationId: req.auth!.organizationId,
      ownerUserId: req.auth!.userId,
      filename,
      mimeType: contentType,
      sizeBytes: BigInt(content.length),
      format,
      storageKey
    }
  });

  const fullPath = path.join(LOCAL_STORAGE_ROOT, storageKey);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content);

  res.status(201).json({ data: { fileAssetId: fileAsset.id } });
});

v1Router.put(
  "/files/upload/:storageKey",
  express.raw({ type: "*/*", limit: "500mb" }),
  async (req, res) => {
    const storageKey = decodeURIComponent(String(req.params.storageKey ?? ""));
    const asset = await prisma.fileAsset.findUnique({
      where: { storageKey }
    });

    if (!asset || asset.organizationId !== req.auth!.organizationId) {
      res.status(404).json({ error: "Upload target not found." });
      return;
    }

    const content = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
    const fullPath = path.join(LOCAL_STORAGE_ROOT, storageKey);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);

    await prisma.fileAsset.update({
      where: { id: asset.id },
      data: { sizeBytes: BigInt(content.length) }
    });

    res.status(204).send();
  }
);

v1Router.get("/files/download/:storageKey", async (req, res) => {
  const storageKey = decodeURIComponent(String(req.params.storageKey ?? ""));
  const asset = await prisma.fileAsset.findUnique({
    where: { storageKey }
  });

  if (!asset || asset.organizationId !== req.auth!.organizationId) {
    res.status(404).json({ error: "File not found." });
    return;
  }

  const fullPath = path.join(LOCAL_STORAGE_ROOT, storageKey);
  if (!existsSync(fullPath)) {
    res.status(404).json({ error: "File content not found." });
    return;
  }

  const content = await readFile(fullPath);
  res.setHeader("Content-Type", asset.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${asset.filename}"`);
  res.send(content);
});

v1Router.post("/api-keys", async (req, res) => {
  const rawKey = `cc_${crypto.randomBytes(20).toString("hex")}`;
  const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

  const key = await prisma.apiKey.create({
    data: {
      name: String(req.body.name ?? "default"),
      organizationId: req.auth!.organizationId,
      userId: req.auth!.userId,
      hashedKey
    }
  });

  res.status(201).json({ data: { id: key.id, key: rawKey } });
});

v1Router.get("/api-keys", async (req, res) => {
  const keys = await prisma.apiKey.findMany({
    where: {
      organizationId: req.auth!.organizationId
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      revokedAt: true,
      lastUsedAt: true
    }
  });
  res.json({ data: keys });
});

v1Router.post("/api-keys/:id/revoke", async (req, res) => {
  const existing = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.organizationId !== req.auth!.organizationId) {
    res.status(404).json({ error: "Key not found." });
    return;
  }
  const key = await prisma.apiKey.update({
    where: { id: req.params.id },
    data: { revokedAt: new Date() }
  });
  res.json({ data: key });
});

v1Router.post("/webhooks", async (req, res) => {
  const endpoint = await prisma.webhookEndpoint.create({
    data: {
      organizationId: req.auth!.organizationId,
      url: String(req.body.url),
      secret: String(req.body.secret ?? crypto.randomBytes(16).toString("hex")),
      events: Array.isArray(req.body.events) ? req.body.events.map(String) : ["job.finished"]
    }
  });
  res.status(201).json({ data: endpoint });
});

v1Router.get("/webhooks", async (req, res) => {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { organizationId: req.auth!.organizationId, disabledAt: null },
    orderBy: { createdAt: "desc" }
  });
  res.json({ data: endpoints });
});

v1Router.get("/usage", async (req, res) => {
  const summary = await getUsageSummary(req.auth!.organizationId);
  res.json({ data: summary });
});

v1Router.post("/billing/checkout", async (req, res) => {
  const priceId = String(req.body.priceId ?? "");
  if (!priceId) {
    res.status(400).json({ error: "priceId is required." });
    return;
  }

  const session = await createCheckoutSession(req.auth!.organizationId, priceId);
  res.status(201).json({ data: { checkoutUrl: session.url } });
});

v1Router.get("/billing/plans", (_req, res) => {
  res.json({ data: defaultPlanQuotas });
});

v1Router.get("/billing/subscription", async (req, res) => {
  const subscription = await prisma.planSubscription.findUnique({
    where: { organizationId: req.auth!.organizationId }
  });
  res.json({ data: subscription });
});

v1Router.post("/billing/webhook", async (req, res) => {
  // Placeholder webhook parser for scaffold. Add Stripe signature verification in production.
  const stripeSubscriptionId = String(req.body.subscriptionId ?? "");
  const planCode = String(req.body.planCode ?? "free");
  const status = String(req.body.status ?? "active");
  if (!stripeSubscriptionId) {
    res.status(400).json({ error: "subscriptionId is required." });
    return;
  }

  const updated = await reconcileSubscriptionFromWebhook(stripeSubscriptionId, planCode, status);
  res.json({ data: updated });
});

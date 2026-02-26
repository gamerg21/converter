import type { Request, Response, NextFunction } from "express";

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

const allowedMimePrefixes = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/zip",
  "application/vnd"
];

export const validateUploadPolicy = (req: Request, res: Response, next: NextFunction): void => {
  const contentType = req.header("content-type") ?? "";
  const contentLength = Number(req.header("content-length") ?? req.header("x-file-size") ?? "0");

  const allowed = allowedMimePrefixes.some((prefix) => contentType.startsWith(prefix));
  if (!allowed) {
    res.status(415).json({ error: "Unsupported file type." });
    return;
  }

  if (contentLength > MAX_FILE_SIZE_BYTES) {
    res.status(413).json({ error: "File exceeds limit." });
    return;
  }

  next();
};

export const buildSignedDownloadUrl = (storageKey: string): string =>
  `http://localhost:4000/v1/files/download/${encodeURIComponent(storageKey)}?token=dev-signed-token`;

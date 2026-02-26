"use client";

import { useEffect, useMemo, useState } from "react";
import { getOutputsForInput } from "@convertr/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const extensionAliases: Record<string, string> = {
  jpeg: "jpg",
  jpe: "jpg",
  jfif: "jpg",
  tif: "tiff",
  heif: "heic",
  "x-icon": "ico",
  "vnd.microsoft.icon": "ico"
};

const supportedImageInputs = new Set([
  "png",
  "jpg",
  "webp",
  "avif",
  "gif",
  "bmp",
  "tiff",
  "heic",
  "svg",
  "ico"
]);

const normalizeExtension = (value: string): string => {
  const lowered = value.toLowerCase();
  return extensionAliases[lowered] ?? lowered;
};

const detectSourceFormatFromName = (filename: string): string | null => {
  const parts = filename.split(".");
  if (parts.length < 2) {
    return null;
  }
  const normalizedFromName = normalizeExtension(parts[parts.length - 1] ?? "");
  if (normalizedFromName && getOutputsForInput(normalizedFromName).length > 0) {
    return normalizedFromName;
  }
  return null;
};

const getFormatsFromUrl = (rawUrl: string): string[] => {
  const formats = new Set<string>();

  const addCandidateFromPath = (value: string) => {
    const fromName = detectSourceFormatFromName(value.split("/").pop() ?? "");
    if (fromName) {
      formats.add(fromName);
    }
  };

  try {
    const parsed = new URL(rawUrl);
    addCandidateFromPath(parsed.pathname);

    for (const key of ["u", "url", "src", "image"]) {
      const nested = parsed.searchParams.get(key);
      if (!nested) {
        continue;
      }
      addCandidateFromPath(nested);
      try {
        const parsedNested = new URL(nested);
        addCandidateFromPath(parsedNested.pathname);
      } catch {
        // Nested value might not be a full URL; path-style handling above covers that.
      }
    }
  } catch {
    // Invalid URL, no format candidates.
  }

  return Array.from(formats);
};

const detectSourceFormat = (file: File | null, sourceUrl: string | null): string | null => {
  if (!file) {
    if (!sourceUrl) {
      return null;
    }
    const candidates = getFormatsFromUrl(sourceUrl);
    return candidates[0] ?? null;
  }

  const fromFileName = detectSourceFormatFromName(file.name);
  if (fromFileName) {
    return fromFileName;
  }

  if (file.type.startsWith("image/")) {
    const subtype = file.type.slice("image/".length).split("+")[0] ?? "";
    const normalizedFromMime = normalizeExtension(subtype);
    if (supportedImageInputs.has(normalizedFromMime)) {
      return normalizedFromMime;
    }
    return "jpg";
  }

  return null;
};

type ConvertrFormProps = {
  selectedFile: File | null;
  selectedUrl: string | null;
};

export function ConvertrForm({ selectedFile, selectedUrl }: ConvertrFormProps) {
  const [targetFormat, setTargetFormat] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const sourceFormat = useMemo(
    () => detectSourceFormat(selectedFile, selectedUrl),
    [selectedFile, selectedUrl]
  );
  const targets = useMemo(
    () => (sourceFormat ? getOutputsForInput(sourceFormat) : []),
    [sourceFormat]
  );

  useEffect(() => {
    if (targets.length === 0) {
      setTargetFormat("");
      return;
    }
    setTargetFormat((current) => (targets.includes(current) ? current : (targets[0] ?? "")));
  }, [targets]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const usingUrlSource = !selectedFile && !!selectedUrl;
    if (!selectedFile && !usingUrlSource) {
      setMessage("Pick a file or paste a URL first.");
      return;
    }
    if (!sourceFormat) {
      setMessage("Could not detect source format from the file name.");
      return;
    }
    if (!targetFormat) {
      setMessage("No target format available for this file.");
      return;
    }

    setMessage("Creating conversion job...");

    let fileAssetId = "";
    if (usingUrlSource) {
      const importResponse = await fetch("http://localhost:4000/v1/files/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: selectedUrl })
      });
      if (!importResponse.ok) {
        setMessage("Failed to import file from URL.");
        return;
      }
      const importPayload = await importResponse.json();
      fileAssetId = String(importPayload?.data?.fileAssetId ?? "");
      if (!fileAssetId) {
        setMessage("URL import did not return a file id.");
        return;
      }
    } else if (selectedFile) {
      const presignResponse = await fetch("http://localhost:4000/v1/files/presign", {
        method: "POST",
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
          "x-file-name": selectedFile.name,
          "x-file-size": String(selectedFile.size)
        }
      });

      if (!presignResponse.ok) {
        setMessage("Failed to register uploaded file.");
        return;
      }

      const presignPayload = await presignResponse.json();
      fileAssetId = String(presignPayload?.data?.fileAssetId ?? "");
      const uploadUrl = String(presignPayload?.data?.uploadUrl ?? "");
      if (!fileAssetId) {
        setMessage("Upload registration did not return a file id.");
        return;
      }
      if (!uploadUrl) {
        setMessage("Upload registration did not return an upload URL.");
        return;
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type || "application/octet-stream" },
        body: selectedFile
      });

      if (!uploadResponse.ok) {
        setMessage("Failed to upload file content.");
        return;
      }
    }

    const response = await fetch("http://localhost:4000/v1/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceFormat,
        targetFormat,
        fileAssetId,
        options: {}
      })
    });

    if (!response.ok) {
      setMessage("Failed to create job.");
      return;
    }
    const payload = await response.json();
    setMessage(`Job queued: ${payload.data.id}`);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">File convertr</CardTitle>
        <CardDescription>
          Supports audio, video, document, ebook, archive, image, spreadsheet and presentation
          formats.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Source format: <span className="font-medium text-foreground">{sourceFormat ?? "waiting for file selection"}</span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="target-format">Target format</Label>
            <select
              id="target-format"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              disabled={targets.length === 0}
            >
              {targets.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full">
            Convert
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

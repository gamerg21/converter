import { canConvertPair } from "@convertr/shared";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { ConversionAdapter, ConversionRequest, ConversionResult } from "../types";

const normalizeFormat = (value: string): string => {
  const lowered = value.toLowerCase();
  if (lowered === "jpeg") return "jpg";
  if (lowered === "tif") return "tiff";
  if (lowered === "heif") return "heic";
  return lowered;
};

const imageFormats = new Set([
  "png",
  "jpg",
  "webp",
  "avif",
  "gif",
  "tiff",
  "heic",
  "svg",
  "ico"
]);

const sharpOutputFormats = new Set(["png", "jpg", "webp", "avif", "gif", "tiff"]);

export class BasicAdapter implements ConversionAdapter {
  name = "basic-adapter";

  supports(source: string, target: string): boolean {
    return canConvertPair(source, target);
  }

  async convert(request: ConversionRequest): Promise<ConversionResult> {
    if (!this.supports(request.sourceFormat, request.targetFormat)) {
      return {
        success: false,
        error: "Unsupported conversion pair."
      };
    }

    const sourceFormat = normalizeFormat(request.sourceFormat);
    const targetFormat = normalizeFormat(request.targetFormat);
    const isImageToImage = imageFormats.has(sourceFormat) && imageFormats.has(targetFormat);

    await mkdir(path.dirname(request.outputPath), { recursive: true });
    if (isImageToImage) {
      if (!sharpOutputFormats.has(targetFormat)) {
        return {
          success: false,
          error: `Image output format '${targetFormat}' is not supported by the current engine.`
        };
      }

      const image = sharp(request.inputPath, { failOn: "error" });
      if (targetFormat === "jpg") {
        await image.jpeg({ quality: 92, mozjpeg: true }).toFile(request.outputPath);
      } else if (targetFormat === "png") {
        await image.png({ compressionLevel: 8 }).toFile(request.outputPath);
      } else if (targetFormat === "webp") {
        await image.webp({ quality: 90 }).toFile(request.outputPath);
      } else if (targetFormat === "avif") {
        await image.avif({ quality: 50 }).toFile(request.outputPath);
      } else if (targetFormat === "gif") {
        await image.gif().toFile(request.outputPath);
      } else {
        await image.tiff({ quality: 90 }).toFile(request.outputPath);
      }
    } else {
      // Keep scaffold fallback for non-image conversions until dedicated engines are added.
      await copyFile(request.inputPath, request.outputPath);
    }

    return {
      success: true,
      outputPath: request.outputPath,
      metadata: {
        adapter: this.name,
        sourceFormat: request.sourceFormat,
        targetFormat: request.targetFormat
      }
    };
  }
}

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { findCapability } from "../capabilities";
import type { ConversionAdapter, ConversionRequest, ConversionResult } from "../types";

const normalizeFormat = (value: string): string => {
  const lowered = value.toLowerCase();
  if (lowered === "jpeg") return "jpg";
  if (lowered === "tif") return "tiff";
  if (lowered === "heif") return "heic";
  return lowered;
};

const sharpOutputFormats = new Set(["png", "jpg", "webp", "avif", "gif", "tiff"]);

export class BasicAdapter implements ConversionAdapter {
  name = "basic-adapter";

  supports(source: string, target: string): boolean {
    const capability = findCapability(source, target);
    return capability?.pipeline === "sharp";
  }

  async convert(request: ConversionRequest): Promise<ConversionResult> {
    if (!this.supports(request.sourceFormat, request.targetFormat)) {
      return {
        success: false,
        errorCode: "UNSUPPORTED_PAIR",
        error: "Unsupported conversion pair."
      };
    }

    const targetFormat = normalizeFormat(request.targetFormat);
    await mkdir(path.dirname(request.outputPath), { recursive: true });

    if (!sharpOutputFormats.has(targetFormat)) {
      return {
        success: false,
        errorCode: "TOOLING_UNAVAILABLE",
        error: `Image output format '${targetFormat}' is not supported by the Sharp adapter.`
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

    return {
      success: true,
      outputPath: request.outputPath,
      metadata: {
        adapter: this.name,
        pipeline: "sharp",
        sourceFormat: request.sourceFormat,
        targetFormat: request.targetFormat
      }
    };
  }
}

import { findCapability, type ConversionPipeline } from "../capabilities";
import type { ConversionAdapter, ConversionRequest, ConversionResult } from "../types";

const displayNames: Record<ConversionPipeline, string> = {
  sharp: "Sharp",
  ffmpeg: "FFmpeg",
  libreoffice: "LibreOffice",
  pandoc: "Pandoc",
  calibre: "Calibre",
  archive: "Archive tooling"
};

export class ExternalToolAdapter implements ConversionAdapter {
  constructor(
    public readonly name: string,
    private readonly pipeline: ConversionPipeline
  ) {}

  supports(source: string, target: string): boolean {
    const capability = findCapability(source, target);
    return capability?.pipeline === this.pipeline;
  }

  async convert(request: ConversionRequest): Promise<ConversionResult> {
    return {
      success: false,
      errorCode: "TOOLING_UNAVAILABLE",
      error: `${displayNames[this.pipeline]} adapter is planned but not configured in this environment.`,
      metadata: {
        adapter: this.name,
        pipeline: this.pipeline,
        sourceFormat: request.sourceFormat,
        targetFormat: request.targetFormat
      }
    };
  }
}

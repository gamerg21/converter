import { BasicAdapter } from "./adapters/basicAdapter";
import { ExternalToolAdapter } from "./adapters/externalToolAdapter";
import { findCapability } from "./capabilities";
import type { ConversionAdapter, ConversionRequest, ConversionResult } from "./types";

const adapters: ConversionAdapter[] = [
  new BasicAdapter(),
  new ExternalToolAdapter("ffmpeg-adapter", "ffmpeg"),
  new ExternalToolAdapter("libreoffice-adapter", "libreoffice"),
  new ExternalToolAdapter("pandoc-adapter", "pandoc"),
  new ExternalToolAdapter("calibre-adapter", "calibre"),
  new ExternalToolAdapter("archive-adapter", "archive")
];

export const findAdapter = (source: string, target: string): ConversionAdapter | undefined =>
  adapters.find((adapter) => adapter.supports(source, target));

export const executeConversion = async (
  request: ConversionRequest
): Promise<ConversionResult> => {
  const capability = findCapability(request.sourceFormat, request.targetFormat);
  if (!capability) {
    return {
      success: false,
      errorCode: "UNSUPPORTED_PAIR",
      error: "No conversion capability found for this source/target pair."
    };
  }

  const adapter = findAdapter(request.sourceFormat, request.targetFormat);
  if (!adapter) {
    return {
      success: false,
      errorCode: "TOOLING_UNAVAILABLE",
      error: `Capability exists (${capability.pipeline}) but no adapter is configured.`
    };
  }

  return adapter.convert(request);
};

export * from "./types";
export * from "./capabilities";

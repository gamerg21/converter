import { BasicAdapter } from "./adapters/basicAdapter";
import type { ConversionAdapter, ConversionRequest, ConversionResult } from "./types";

const adapters: ConversionAdapter[] = [new BasicAdapter()];

export const findAdapter = (source: string, target: string): ConversionAdapter | undefined =>
  adapters.find((adapter) => adapter.supports(source, target));

export const executeConversion = async (
  request: ConversionRequest
): Promise<ConversionResult> => {
  const adapter = findAdapter(request.sourceFormat, request.targetFormat);
  if (!adapter) {
    return { success: false, error: "No conversion adapter found." };
  }
  return adapter.convert(request);
};

export * from "./types";

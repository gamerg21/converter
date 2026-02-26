export type ConversionRequest = {
  jobId: string;
  inputPath: string;
  outputPath: string;
  sourceFormat: string;
  targetFormat: string;
  options?: Record<string, unknown>;
};

export type ConversionErrorCode =
  | "UNSUPPORTED_PAIR"
  | "TOOLING_UNAVAILABLE"
  | "CONVERSION_FAILED";

export type ConversionResult = {
  success: boolean;
  outputPath?: string;
  error?: string;
  errorCode?: ConversionErrorCode;
  metadata?: Record<string, unknown>;
};

export interface ConversionAdapter {
  name: string;
  supports: (source: string, target: string) => boolean;
  convert: (request: ConversionRequest) => Promise<ConversionResult>;
}

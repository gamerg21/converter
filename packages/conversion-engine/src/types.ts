export type ConversionRequest = {
  jobId: string;
  inputPath: string;
  outputPath: string;
  sourceFormat: string;
  targetFormat: string;
  options?: Record<string, unknown>;
};

export type ConversionResult = {
  success: boolean;
  outputPath?: string;
  error?: string;
  metadata?: Record<string, unknown>;
};

export interface ConversionAdapter {
  name: string;
  supports: (source: string, target: string) => boolean;
  convert: (request: ConversionRequest) => Promise<ConversionResult>;
}

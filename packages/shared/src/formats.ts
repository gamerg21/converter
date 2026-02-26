export type ConversionCategory =
  | "audio"
  | "video"
  | "document"
  | "ebook"
  | "archive"
  | "image"
  | "spreadsheet"
  | "presentation";

export type FormatCapability = {
  input: string;
  output: string[];
  category: ConversionCategory;
};

const imageOutputPriority = ["png", "jpg", "webp", "avif", "gif", "bmp", "tiff", "pdf"];
const imageOutputsFor = (input: string): string[] =>
  imageOutputPriority.filter((format) => format !== input);

export const formatMatrix: FormatCapability[] = [
  { input: "png", output: imageOutputsFor("png"), category: "image" },
  { input: "jpg", output: imageOutputsFor("jpg"), category: "image" },
  { input: "webp", output: imageOutputsFor("webp"), category: "image" },
  { input: "avif", output: imageOutputsFor("avif"), category: "image" },
  { input: "gif", output: imageOutputsFor("gif"), category: "image" },
  { input: "bmp", output: imageOutputsFor("bmp"), category: "image" },
  { input: "tiff", output: imageOutputsFor("tiff"), category: "image" },
  { input: "heic", output: imageOutputPriority, category: "image" },
  { input: "svg", output: imageOutputPriority, category: "image" },
  { input: "ico", output: imageOutputPriority, category: "image" },
  { input: "pdf", output: ["docx", "txt", "png"], category: "document" },
  { input: "docx", output: ["pdf", "txt"], category: "document" },
  { input: "pptx", output: ["pdf"], category: "presentation" },
  { input: "xlsx", output: ["csv", "pdf"], category: "spreadsheet" },
  { input: "mp4", output: ["mp3", "webm"], category: "video" },
  { input: "mp3", output: ["wav", "flac"], category: "audio" },
  { input: "zip", output: ["tar"], category: "archive" }
];

export const getOutputsForInput = (input: string): string[] => {
  const row = formatMatrix.find((item) => item.input === input.toLowerCase());
  return row?.output ?? [];
};

export const canConvertPair = (input: string, output: string): boolean =>
  getOutputsForInput(input).includes(output.toLowerCase());

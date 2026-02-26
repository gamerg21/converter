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

const createDenseRows = (
  formats: string[],
  category: ConversionCategory,
  preferredOutputs?: string[]
): FormatCapability[] =>
  formats.map((input) => ({
    input,
    category,
    output: (preferredOutputs ?? formats).filter((candidate) => candidate !== input)
  }));

const audioCore = ["mp3", "wav", "flac", "aac", "m4a", "ogg", "opus", "wma", "aiff", "alac"];
const audioPreferredOutputs = ["mp3", "wav", "flac", "aac", "ogg", "opus"];

const videoCore = ["mp4", "mkv", "mov", "webm", "avi", "wmv", "flv", "m4v", "mpeg", "3gp"];
const videoPreferredOutputs = ["mp4", "mkv", "mov", "webm"];
const videoAudioExtractionOutputs = ["mp3", "aac", "wav", "flac", "opus"];

const documentFormats = ["pdf", "docx", "doc", "odt", "rtf", "txt", "html", "md"];
const spreadsheetFormats = ["xlsx", "xls", "ods", "csv", "tsv"];
const presentationFormats = ["pptx", "ppt", "odp", "key"];
const ebookFormats = ["epub", "mobi", "azw3", "fb2", "htmlz", "txt", "pdf"];

const archiveFormats = ["zip", "tar", "gz", "bz2", "xz", "7z", "rar"];

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
  ...createDenseRows(audioCore, "audio", audioPreferredOutputs),
  ...createDenseRows(videoCore, "video", [...videoPreferredOutputs, ...videoAudioExtractionOutputs]),
  ...createDenseRows(documentFormats, "document", ["pdf", "txt", "html", "md", "docx", "odt", "rtf"]),
  ...createDenseRows(spreadsheetFormats, "spreadsheet", ["xlsx", "ods", "csv", "tsv", "pdf"]),
  ...createDenseRows(presentationFormats, "presentation", ["pdf", "png", "jpg"]),
  ...createDenseRows(ebookFormats, "ebook", ["epub", "mobi", "azw3", "fb2", "txt", "html", "pdf"]),
  ...createDenseRows(archiveFormats, "archive", ["zip", "tar", "gz", "bz2", "xz", "7z"])
];

export const getOutputsForInput = (input: string): string[] => {
  const row = formatMatrix.find((item) => item.input === input.toLowerCase());
  return row?.output ?? [];
};

export const getCategoryForInput = (input: string): ConversionCategory | undefined =>
  formatMatrix.find((item) => item.input === input.toLowerCase())?.category;

export const canConvertPair = (input: string, output: string): boolean =>
  getOutputsForInput(input).includes(output.toLowerCase());

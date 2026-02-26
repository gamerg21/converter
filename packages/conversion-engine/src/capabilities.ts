import { formatMatrix, type ConversionCategory } from "@convertr/shared";

export type ConversionPipeline =
  | "sharp"
  | "ffmpeg"
  | "libreoffice"
  | "pandoc"
  | "calibre"
  | "archive";

export type ConversionCapability = {
  source: string;
  target: string;
  category: ConversionCategory;
  pipeline: ConversionPipeline;
};

const sharpOutputs = new Set(["png", "jpg", "webp", "avif", "gif", "tiff"]);
const pandocTextFormats = new Set(["md", "html", "txt"]);

const resolvePipeline = (
  category: ConversionCategory,
  source: string,
  target: string
): ConversionPipeline => {
  if (category === "image") {
    return sharpOutputs.has(target) ? "sharp" : "libreoffice";
  }

  if (category === "audio" || category === "video") {
    return "ffmpeg";
  }

  if (category === "document") {
    if (pandocTextFormats.has(source) && pandocTextFormats.has(target)) {
      return "pandoc";
    }
    return "libreoffice";
  }

  if (category === "spreadsheet" || category === "presentation") {
    return "libreoffice";
  }

  if (category === "ebook") {
    return "calibre";
  }

  return "archive";
};

export const capabilityRegistry: ConversionCapability[] = formatMatrix.flatMap((row) =>
  row.output.map((target) => ({
    source: row.input,
    target,
    category: row.category,
    pipeline: resolvePipeline(row.category, row.input, target)
  }))
);

export const findCapability = (
  sourceFormat: string,
  targetFormat: string
): ConversionCapability | undefined =>
  capabilityRegistry.find(
    (capability) =>
      capability.source === sourceFormat.toLowerCase() &&
      capability.target === targetFormat.toLowerCase()
  );

import { z } from "zod";
import { canConvertPair } from "./formats";

export const createJobSchema = z
  .object({
    sourceFormat: z.string().min(2),
    targetFormat: z.string().min(2),
    fileAssetId: z.string().uuid(),
    options: z.record(z.string(), z.any()).default({})
  })
  .superRefine((data, ctx) => {
    if (!canConvertPair(data.sourceFormat, data.targetFormat)) {
      ctx.addIssue({
        code: "custom",
        message: "Unsupported conversion pair."
      });
    }
  });

export type CreateJobInput = z.infer<typeof createJobSchema>;

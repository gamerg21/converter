import test from "node:test";
import assert from "node:assert/strict";
import { executeConversion } from "./index";

test("converts supported pair with basic adapter", async () => {
  const result = await executeConversion({
    jobId: "job-1",
    inputPath: "/tmp/input.png",
    outputPath: "/tmp/output.jpg",
    sourceFormat: "png",
    targetFormat: "jpg"
  });
  assert.equal(result.success, true);
});

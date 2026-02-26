import test from "node:test";
import assert from "node:assert/strict";
import { executeConversion, findAdapter, findCapability } from "./index";

test("finds a sharp adapter for image pairs", () => {
  const adapter = findAdapter("png", "jpg");
  assert.equal(adapter?.name, "basic-adapter");
});

test("resolves capabilities for new categories", () => {
  const capability = findCapability("mp4", "mp3");
  assert.equal(capability?.pipeline, "ffmpeg");
});

test("returns tooling unavailable for planned non-image adapter", async () => {
  const result = await executeConversion({
    jobId: "job-2",
    inputPath: "/tmp/input.mp4",
    outputPath: "/tmp/output.mp3",
    sourceFormat: "mp4",
    targetFormat: "mp3"
  });

  assert.equal(result.success, false);
  assert.equal(result.errorCode, "TOOLING_UNAVAILABLE");
});

test("rejects unsupported conversion pairs", async () => {
  const result = await executeConversion({
    jobId: "job-3",
    inputPath: "/tmp/input.zip",
    outputPath: "/tmp/output.mp3",
    sourceFormat: "zip",
    targetFormat: "mp3"
  });

  assert.equal(result.success, false);
  assert.equal(result.errorCode, "UNSUPPORTED_PAIR");
});

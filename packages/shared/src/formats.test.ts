import test from "node:test";
import assert from "node:assert/strict";
import { canConvertPair, getOutputsForInput } from "./formats";

test("returns supported targets for png", () => {
  const outputs = getOutputsForInput("png");
  assert.ok(outputs.includes("jpg"));
});

test("prioritizes common outputs for image inputs", () => {
  const outputs = getOutputsForInput("webp");
  assert.equal(outputs[0], "png");
  assert.equal(outputs[1], "jpg");
});

test("supports less common image inputs", () => {
  const outputs = getOutputsForInput("heic");
  assert.ok(outputs.includes("png"));
  assert.ok(outputs.includes("jpg"));
});

test("rejects unsupported pairs", () => {
  assert.equal(canConvertPair("zip", "mp3"), false);
});

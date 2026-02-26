import test from "node:test";
import assert from "node:assert/strict";
import { canConvertPair, getCategoryForInput, getOutputsForInput } from "./formats";

test("returns supported targets for png", () => {
  const outputs = getOutputsForInput("png");
  assert.ok(outputs.includes("jpg"));
});

test("prioritizes common outputs for image inputs", () => {
  const outputs = getOutputsForInput("webp");
  assert.equal(outputs[0], "png");
  assert.equal(outputs[1], "jpg");
});

test("adds broad audio and video support", () => {
  assert.equal(canConvertPair("mp3", "opus"), true);
  assert.equal(canConvertPair("mkv", "mp4"), true);
  assert.equal(canConvertPair("mp4", "flac"), true);
});

test("adds ebook and archive support", () => {
  assert.equal(canConvertPair("epub", "mobi"), true);
  assert.equal(canConvertPair("zip", "7z"), true);
  assert.equal(getCategoryForInput("epub"), "ebook");
});

test("rejects unsupported pairs", () => {
  assert.equal(canConvertPair("zip", "mp3"), false);
});

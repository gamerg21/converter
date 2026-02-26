# Convertr Format Expansion Plan

## Objective
Expand Convertr from the current image-first baseline into a broad, self-hosted conversion platform that supports production-grade audio, video, document, ebook, archive, spreadsheet, and presentation workflows.

## Current Baseline (from `formatMatrix`)
- **Image**: broad support already in place (`png`, `jpg`, `webp`, `avif`, `gif`, `bmp`, `tiff`, plus `heic`, `svg`, `ico`).
- **Document**: limited (`pdf` -> `docx|txt|png`, `docx` -> `pdf|txt`).
- **Presentation**: minimal (`pptx` -> `pdf`).
- **Spreadsheet**: minimal (`xlsx` -> `csv|pdf`).
- **Video**: minimal (`mp4` -> `mp3|webm`).
- **Audio**: minimal (`mp3` -> `wav|flac`).
- **Archive**: minimal (`zip` -> `tar`).
- **Ebook**: category exists, but no formats currently implemented.

## Guiding Principles
1. **Deterministic, local-first conversion paths** with explicit toolchains (FFmpeg, LibreOffice, Calibre, Pandoc, 7z, etc.).
2. **Whitelist-only format matrix**: every supported pair is intentional, tested, and documented.
3. **Category-by-category rollout** to minimize blast radius and simplify observability.
4. **Graceful degradation**: unsupported pairs fail fast with clear API/UI messaging.
5. **Security-first defaults**: sandboxing, size limits, timeout caps, MIME/content sniffing, and archive bomb protection.

## Phase 0 - Foundation Hardening (Prerequisite)
Before expanding formats, make the conversion substrate robust:

- Introduce a **capability registry** in `packages/conversion-engine` mapping each format pair to an adapter + runtime requirements.
- Extend job metadata to include:
  - detected MIME + extension,
  - selected conversion pipeline,
  - execution metrics (runtime, memory, exit code),
  - deterministic error classification (unsupported, invalid input, tool failure, timeout).
- Add configurable limits per category:
  - max input bytes,
  - max duration/pages/slides where relevant,
  - timeout budget.
- Add golden fixture folders for each category to support regression tests.

## Phase 1 - Audio + Video Expansion
### Audio formats
Add common ingest/output formats:
- `mp3`, `wav`, `flac`, `aac`, `m4a`, `ogg`, `opus`, `wma`, `aiff`, `alac`.

Recommended first-class conversions:
- Any lossy/lossless audio -> `mp3|wav|flac|aac|ogg|opus`.
- Keep niche/proprietary outputs (`wma`, `alac`) optional at first depending on codec availability.

### Video formats
Add:
- `mp4`, `mkv`, `mov`, `webm`, `avi`, `wmv`, `flv`, `m4v`, `mpeg`, `3gp`.

Recommended first-class conversions:
- video -> video transcodes among `mp4|mkv|mov|webm`.
- video -> audio extraction (`mp3|aac|wav|flac|opus`).

Tooling:
- FFmpeg-based adapter with profile presets (fast, balanced, quality).
- Explicit codec/profile matrix to avoid impossible pair promises.

## Phase 2 - Document + Office Expansion
### Documents
Add:
- `pdf`, `docx`, `doc`, `odt`, `rtf`, `txt`, `html`, `md`, `epub` (cross-linked with ebook).

Recommended conversions:
- Office-like -> `pdf|txt|html`.
- `md|html|txt` interop via Pandoc.
- `pdf` to text/image extraction with clear caveats for layout fidelity.

### Spreadsheets
Add:
- `xlsx`, `xls`, `ods`, `csv`, `tsv`.

Recommended conversions:
- spreadsheet -> `xlsx|ods|csv|tsv|pdf`.
- CSV/TSV charset normalization and delimiter controls.

### Presentations
Add:
- `pptx`, `ppt`, `odp`, `key` (import caveat if unsupported natively).

Recommended conversions:
- presentation -> `pdf`.
- optional slide-image export (`png|jpg` one file per slide or zipped bundle).

Tooling:
- LibreOffice headless adapter for broad office conversions.
- Optional unoconv wrapper if operationally simpler in containerized environments.

## Phase 3 - Ebook + Archive Expansion
### Ebook
Add:
- `epub`, `mobi`, `azw3`, `fb2`, `htmlz`, `txt`, `pdf` (with fidelity caveats).

Recommended conversions:
- `epub <-> mobi|azw3|fb2|txt|html`.
- avoid overpromising around DRM-protected books (explicitly unsupported).

Tooling:
- Calibre CLI (`ebook-convert`) adapter.

### Archive
Add:
- `zip`, `tar`, `gz`, `bz2`, `xz`, `7z`, `rar` (extract-only unless licensing/tooling allows write).

Recommended conversions:
- archive repackage: `zip <-> tar.gz|tar.xz|7z`.
- extraction workflows for single-asset conversion pipelines.

Security controls:
- archive traversal checks,
- expansion ratio limits,
- nested archive depth limit,
- blocked executable extensions (configurable).

## Phase 4 - Productization and UX
- Replace flat format list with **category-driven source/target selectors**.
- Show format caveats inline (lossy, layout drift, DRM unsupported, multi-file output).
- Expose conversion profiles (e.g., audio bitrate, video resolution, PDF/A option).
- Add API endpoint for dynamic capabilities so UI stays in sync with worker tooling.

## Data Model & API Changes
- Add `conversion_capabilities` source of truth (code-first or DB-backed).
- Optionally store output metadata:
  - duration, bitrate, resolution, page count, codec.
- Version capabilities in API to avoid client mismatch during rolling deploys.

## Testing Strategy
1. **Unit tests**
   - format matrix validation,
   - capability registry integrity,
   - pair support lookup.
2. **Adapter integration tests**
   - per-tool smoke tests using tiny fixtures.
3. **End-to-end tests**
   - upload -> queue -> convert -> download flow for one representative pair per category.
4. **Negative tests**
   - unsupported pairs,
   - malformed files,
   - oversized input,
   - timeout behavior,
   - archive bomb defenses.

## Observability & Operations
- Per-category success/failure rate dashboards.
- P95/P99 conversion latency by pair and file size buckets.
- Error taxonomy dashboard (tool missing, invalid input, unsupported codec, timeout).
- Feature flags for gradual rollout per category/pair.

## Suggested Delivery Milestones
1. **Milestone A (1-2 weeks)**
   - Phase 0 + expanded audio/video core pairs.
2. **Milestone B (1-2 weeks)**
   - document/spreadsheet/presentation via LibreOffice + Pandoc.
3. **Milestone C (1 week)**
   - ebook + archive with hardened security checks.
4. **Milestone D (ongoing)**
   - UX polish, profile controls, capability API, and performance tuning.

## Immediate Next Actions
1. Implement a capability registry and migrate current `formatMatrix` to generate from it.
2. Add FFmpeg adapter presets and broaden audio/video matrix.
3. Add LibreOffice adapter and first office conversion fixtures.
4. Add per-job error codes and surfaced user-facing messages.
5. Ship behind feature flags and expand category-by-category.

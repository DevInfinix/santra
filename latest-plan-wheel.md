# Santra wheel plan — November 2026

This is the working delivery plan for the two wheel modes. It replaces feature-by-feature planning with one wheel family at a time. It is a plan, not a support claim: a slice is shown only after its local processor and output route are detected, tested, and registered.

## Non-negotiable interaction contract

- **Shift** selects a local conversion and queues it directly. A successful selection must not open, focus, or restore the Santra workspace.
- **Alt / Ctrl+Shift** opens a compact, rounded, dedicated tool window for the selected file(s). It must never fall back to the workspace. If a tool window cannot be created, close the wheel and show a local notification; do not open the app as a substitute.
- **Ctrl** performs its file action directly. It never opens the workspace.
- The user opens Santra deliberately when they want its settings, history, queue, or accessibility fallback.
- Every editor renders its preview immediately in-process where safe; saving always creates a new local output through the job system and preserves the source.
- Wheel visibility comes from the capability registry, never from an extension alone.

## Delivery order

1. **Window/routing foundation.** Add generic dedicated Audio and PDF tool windows following the existing Image/Video context handoff pattern. Change the global-wheel completion path so a successful Alt/Ctrl action closes without `show`/`set_focus`/workspace handoff. Preserve the existing user-initiated workspace fallback only for an unselected drop or explicit error review.
2. **Shared editor primitives.** Adopt the project’s rounded surface, native-safe window bounds, 8 px spacing rhythm, visible keyboard focus, and accessible labelled controls. Replace clipped native `<select>` controls with the installed shadcn/Radix-style Select primitive before adding further fields. Every control has loading, empty, error, changed, and saved states.
3. **Image, then Video, then Audio, PDF, and Spreadsheet.** Finish a family’s Shift + Alt surface, processor, capability gate, narrow tests, and screenshot review before moving on.
4. **Validation.** Run typecheck and targeted browser/desktop tests per family; manually validate a real GNOME and Explorer drag for no-workspace behavior. No global-drag claim is made before those manual checks.

## Image wheel

### Shift conversion

- Keep current verified raster conversions only. Do not expose routes based solely on filename.
- Preserve existing metadata behavior and the explicit metadata tools. Do not add the removed generic processing notice to new editor surfaces.

### Alt tools

- Remove the repeated statement about raster processing, megapixel limit, metadata removal, and first animated frame from all image editor panels. Limits remain available in capability/error states; metadata tools remain unchanged.
- **Resize:** live canvas preview; width/height, aspect-lock and fit controls; output extension Select (only verified encoders); remove Before/Current; enable Reset only after a value differs from the initial state.
- **Crop:** use the image crop editor model: stable crop frame, direct corner/edge handles, deliberate pan and zoom with no animated chase effect, keyboard nudge, aspect presets, and a clear reset. The crop does not move merely because the pointer crosses the preview.
- **Rotate & flip:** consolidate flip into Rotate. Remove the standalone Flip wheel slice and capability route after migration.
- **Background:** replace clipped selects; offer `Single colour`, `Image`, `Landscape`, `Portrait`, and `Custom` fit. Landscape/Portrait establish canvas aspect ratios; Custom exposes exact dimensions. Background-image swatches can ship once user-provided assets are licensed and added; until then the image picker is local-file only.
- **Edit photo / compress / metadata:** retain the existing non-destructive preview/save contract; every change updates the preview immediately and enables Reset.

## Video wheel (FFmpeg/FFprobe)

All saved video outputs use detected local FFmpeg routes. The editor is a preview and parameter authoring surface; FFmpeg applies the final job. Remove the repeated first-stream/codec-metadata caveat and per-tool instructional paragraphs. Put necessary constraints inline next to invalid fields instead.

| Wheel tool | Final FFmpeg operation | Editor model |
| --- | --- | --- |
| Compress | Re-encode with selected codec/quality, e.g. CRF | Preset plus advanced codec settings gated by encoder availability |
| Trim | `-ss` / `-to`, re-encode for accurate cuts | One precise range on the timeline |
| Split | One `-ss` / `-to` output per track | Independent multi-track clip ranges; add/remove/reorder tracks |
| Merge | concat demuxer/filter as compatible | Ordered source list; explicitly choose sequential concatenate vs audio/video mix when mix becomes supported |
| Crop & resize | `-vf crop,scale` | Reuse the image crop interaction, then scale/output controls |
| Rotate & flip | `-vf transpose` / flip filter | One combined transform tool with live preview |
| Speed | `setpts` plus matching audio tempo policy | Speed presets and pitch/audio treatment clearly stated before export |
| Frames & GIF | `-frames:v 1` or palette generation/use | One timeline selection; choose still image(s) or GIF output |
| Mute & extract audio | `-an` or `-vn` | One Audio tool with a mutually exclusive output mode |
| Redact | `drawbox` / supported blur filter | Multiple independent tracks with time ranges and shape overlays |
| Delete metadata | `-map_metadata -1` | One confirmation/action panel |

- Repair Play/Pause/replay with a single source of truth from the HTML media element, disabled controls until metadata is loaded, and a visible playback error state.
- Remove standalone Flip, Resize, Snapshot, Create GIF, Mute, and Extract Audio slices once their combined routes are capability-registered.
- **Split:** each new clip has its own track, source range, duration, delete control, and output index. Ranges are independent rather than being constrained by track 1.
- **Redact:** each independent track supports rectangle, circle, triangle, and freehand path; default is filled, with an outline-only toggle. Static masks are initial scope. Tracking, irreversible/secure redaction, and content recovery claims remain out of scope.

## Audio wheel (WaveSurfer + FFmpeg)

Audio opens its dedicated popup, never an in-workspace modal. WaveSurfer renders the local waveform and playback; Regions define selections; Envelope defines previewable gain/fade points; Record creates a browser audio blob after microphone permission. FFmpeg writes the new output.

- Trim, split, merge, volume, fades, mute, speed, and extract audio use Regions for preview and FFmpeg for saved output.
- Normalize uses detected `loudnorm`; remove silence uses `silenceremove`; noise reduction is a separate detected `afftdn` capability rather than a generic promise.
- Volume and speed playback controls are clearly marked as preview-only until an export action is selected.
- Merge starts as **sequential concatenation**. A later `Mix together` choice is a distinct operation with a separate output/normalization policy.
- Record requires microphone permission, shows device/permission failure locally, and offers FFmpeg conversion only after the blob is safely written as a new local source.
- Source preservation, codec/format capability gating, cancellation, and waveform lifecycle cleanup are required for each route.

## PDF wheel (pdf-lib + pdfjs-dist)

PDF opens its dedicated popup, never the workspace. `pdfjs-dist` renders thumbnails and the expanded page view; `pdf-lib` creates all saved derivative PDFs.

- **Compress:** quality slider maps to a documented conservative/basic optimization policy. The UI must say that it is not a guaranteed size reduction. A true image-recompression quality control is blocked until an appropriate local PDF raster/rewrite backend is selected.
- **Extract pages:** thumbnail grid, selectable pages, double-click expanded viewer, save selected pages in original order.
- **Merge PDFs:** ordered source cards with a final dotted `+` card that opens the local file picker; drag reorders inputs.
- **Rotate pages:** thumbnail grid with selection; Rotate left and Rotate right apply to selected pages before save.
- **Render:** checkbox selection, output image type Select, one image for one page and a ZIP for multiple pages. The ZIP writer and per-page renderer must be capability-gated.

## Spreadsheet wheel (SheetJS)

- **Shift conversions:** SheetJS routes for XLSX, XLS, ODS, CSV, and TSV, with inputs/outputs constrained to the formats SheetJS can actually read/write. CSV/TSV are single-sheet outputs: require a selected sheet rather than silently exporting the first one.
- **PDF:** render the selected sheet to local HTML and invoke the browser/desktop print-to-PDF path. Label it as layout-limited until a reproducible local PDF writer exists; do not claim Excel-equivalent print fidelity.
- **Alt Split:** one output workbook/file per selected worksheet, preserving source untouched.
- **Alt Delete metadata:** strip workbook properties that SheetJS can control, then re-write. Show a loss warning for unsupported document parts, macros, external links, and formatting fidelity before saving.

## Documents and EPUB (Shift)

- Use detected, sandboxed Pandoc routes for DOCX, Markdown, HTML, EPUB, and TXT only after pairwise capability tests.
- Support the requested mappings: DOCX ↔ Markdown, HTML ↔ EPUB, any verified input → TXT, and TXT → DOCX. The existing output route must validate each actual Pandoc reader/writer pair.
- Keep all source files untouched; show loss/fidelity warnings before a conversion whose output cannot preserve source layout.

## Website catalogue change

The public site no longer lists Presentations. Its existing implementation and related documentation are intentionally untouched.

## Known blockers and decisions needed

1. **No-workspace guarantee needs native proof.** Current Audio/PDF tools are workspace dialogs and the global-wheel failure path can hand files to the workspace. Dedicated windows plus routing tests are required before the guarantee is true.
2. **Shadcn is not installed.** The app currently has custom small UI components, not the shadcn Select dependency. We should either install the Radix/shadcn Select stack or add an accessible project-native popover select; the plan assumes the former but it requires dependency approval/install.
3. **WaveSurfer is not installed.** Its Regions, Envelope, and Record plugins are suitable for preview/selection, but they do not export an edited audio file; FFmpeg remains required for every saved edit. Recording output MIME is browser-dependent.
4. **FFmpeg support is environment-specific.** Filters/encoders such as `afftdn`, `loudnorm`, palette generation, drawbox, and codec choices must be queried at runtime and individually capability-registered. Video freehand/circle/triangle redaction requires translating editor shapes into FFmpeg-compatible expressions or a raster-overlay pipeline.
5. **pdf-lib cannot fulfill a true quality slider by itself.** It can copy/merge/rotate pages, but meaningful image re-encoding/compression needs a selected additional local backend or a deliberately limited "basic optimization" control.
6. **PDF render-to-ZIP requires more than pdf-lib.** We need `pdfjs-dist` for rendering and a local ZIP writer/package; performance and memory limits for large PDFs need definition.
7. **SheetJS fidelity boundary.** It supports the requested workbook/text formats, but sheets, styles, formulas, macros, external links, and print layout do not necessarily round-trip. The user-visible pre-save warning and fixture matrix are necessary.
8. **Pandoc scope and safety.** Pandoc must stay detected/sandboxed, with external-resource behavior constrained and each reader/writer pair validated. It cannot promise DOCX layout fidelity.
9. **Background image assets are pending.** The requested swatches cannot be shipped until the supplied assets and their licensing/usage instructions are available.
10. **Terminology:** output in a desktop app should be written beside the input (or to the user’s configured local output folder), not "downloaded". The PDF Render UI will use `Save images` / `Save ZIP`.

## Definition of done for each wheel family

- Verified processor/format/filter capability registration and source-preserving atomic output.
- Dedicated popup for every Alt editor; no successful Alt action opens or focuses the main Santra window.
- Immediate preview, keyboard access, reset/dirty state, loading/error/empty/success states, and no clipped controls.
- Focused unit/component tests, capability tests, and visual screenshot test; then typecheck/build and relevant desktop test.
- Manual GNOME Files and Windows Explorer drag check recorded before making platform-wide interaction claims.

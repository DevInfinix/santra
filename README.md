<p align="center">
  <img src="public/santra.png" alt="Santra logo" width="96" />
</p>

<h1 align="center">One file. A whole world of possibilities.</h1>

<p align="center"><strong>A small, private file workspace for Windows and Linux.</strong></p>

<p align="center">Convert, edit, preview, and organize files locally with a fast drag-first workflow.</p>

<p align="center">
  <a href="https://santra.singhaman.me">Website</a> ·
  <a href="https://github.com/SinghAman21/santra/releases/latest">Downloads</a> ·
  <a href="https://github.com/SinghAman21/santra/issues">Issues</a>
</p>

<p align="center">
  <a href="https://github.com/SinghAman21/santra">
    <img src="https://img.shields.io/github/stars/SinghAman21/santra?style=social&label=Star%20on%20GitHub" alt="GitHub stars" />
  </a>
</p>

> Santra is an offline-first desktop application for Windows 10/11 x64 and Ubuntu LTS x64. It keeps file processing on your device and exposes only the operations supported by the local capabilities it detects.

## Why Santra?

File conversion should not require an upload, an account, or a heavyweight application. Santra brings common conversion and file tools into one compact workspace, with a citrus action wheel for quick keyboard-driven workflows.

- Local by default: files, filenames, previews, and metadata stay on your device.
- Drag-first workflow: double-tap `Shift` for conversion, `Alt` for tools, or `Ctrl` for file actions while dragging.
- Safe outputs: originals are preserved, existing files are not silently overwritten, and successful jobs publish atomically.
- Capability-aware UI: optional routes appear only when their local backend is detected and verified.
- Accessible fallback: the workspace remains available for settings, queue management, history, and keyboard access.

## What it can do

Santra includes built-in local routes for:

- Raster image conversion and editing
- Subtitle conversion between SRT, VTT, and TXT
- ZIP, TAR, and GZIP archive creation and extraction
- Local previews and queued output jobs
- File actions such as copy, move, copy path, reveal, and open

Optional local engines can add more routes when installed:

| Engine | Used for |
| --- | --- |
| FFmpeg / FFprobe | Video and audio conversion, trimming, splitting, GIFs, snapshots, waveforms, and media tools |
| Poppler | PDF page rendering and PDF-related previews |
| qpdf | PDF structural operations such as compression, extraction, merging, and rotation |
| Pandoc | Document conversion across formats such as DOCX, Markdown, HTML, EPUB, and TXT |
| LibreOffice | Office-document, spreadsheet, and presentation workflows where supported |
| ExifTool | JPEG metadata editing and metadata-aware copies |

Optional engines are installed separately, detected locally, and never replaced with an online fallback.

## Status

Santra is an active development preview. The Tauri runtime, local processing routes, queue, settings, capability registry, and browser-level checks are in place. Native Windows and Ubuntu acceptance—especially real Explorer/GNOME drag handoff, mixed-DPI behavior, installed size, and offline installation—is tracked in [the validation checklist](docs/TAURI_VALIDATION_CHECKLIST.md).

See the [Tauri parity matrix](docs/TAURI_PARITY_MATRIX.md) for feature-by-feature status and known gaps.

## Download

Download the latest preview from [GitHub Releases](https://github.com/SinghAman21/santra/releases/latest).

Available package targets are:

- Windows x64: NSIS installer
- Linux x64: Debian package and AppImage

macOS is not supported.

## Development

### Requirements

- Node.js 22
- npm
- Rust and Cargo
- Platform development dependencies listed in [docs/BUILD.md](docs/BUILD.md)

On Ubuntu, install the required native build packages with:

```bash
sudo apt update
sudo apt install \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  libgtk-3-dev \
  librsvg2-dev \
  libssl-dev \
  patchelf
```

### Run locally

```bash
npm ci
npm run typecheck
npm run test
npm run build
npm run desktop
```

`npm run dev` starts a browser-only renderer preview. It does not provide native file access or local conversion engines.

### Test and package

```bash
npm run test:e2e       # Playwright browser checks
npm run dist:linux     # .deb and AppImage on Ubuntu LTS x64
npm run dist:windows   # NSIS on an MSVC x64 Developer PowerShell
```

Use `npm run check:release` to validate release inputs and `npm run release:report` to record artifact hashes and dependency inventory after packages have been built.

## Architecture

Santra is built as a Tauri 2 desktop application:

- React, TypeScript, and Vite provide the renderer and workspace UI.
- Rust owns native commands, local file inspection, job state, safe file actions, previews, and built-in processing.
- Tauri bridges the renderer and native services through a typed adapter with window and capability checks.
- Optional tools run as bounded local subprocesses with fixed argument handling and capability detection.

Read the detailed [architecture notes](docs/ARCHITECTURE.md), [capability registry](docs/CAPABILITIES.md), and format-specific design docs in [`docs/`](docs/).

## Safety and privacy

Santra is designed for local, offline-first use:

- No accounts, uploads, advertising, analytics, or telemetry by default.
- Input files are treated as untrusted and are never executed.
- Archive extraction checks for traversal and symlink escapes.
- Outputs use temporary files and atomic publication where possible.
- Source files are preserved by default and collision handling is configurable.
- Diagnostics copied from the app omit source paths where supported.

Optional third-party engines remain separate installations with their own licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before redistribution.

## Contributing

Issues, bug reports, documentation improvements, and focused pull requests are welcome.

Before opening a pull request:

1. Keep changes focused and preserve the Windows/Linux, offline-first scope.
2. Run the narrowest relevant checks, then the broader checks when practical:

   ```bash
   npm run typecheck
   npm run test
   npm run build
   ```

3. Update the relevant documentation when behavior or support claims change.

Please use [GitHub Issues](https://github.com/SinghAman21/santra/issues) for bugs and feature discussions.

## Roadmap

The current roadmap and known implementation gaps live in [docs/ROADMAP.md](docs/ROADMAP.md). Native acceptance and release validation are intentionally tracked separately from source-level implementation claims.

## License

Santra is released under the [MIT License](LICENSE). Optional local engines are not bundled by default and remain subject to their upstream licenses.

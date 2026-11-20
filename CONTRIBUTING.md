# Contributing to Santra

Thanks for contributing. Santra is an offline-first desktop application for Windows x64 and Linux x64. Keep changes focused, local-first, and safe for user files.

## Start with an issue

Before starting substantial work, create a GitHub issue or comment on an existing issue to claim it. State what you plan to change and wait for a maintainer response if the issue is unclear or already has an active contributor.

For small documentation corrections and narrowly scoped fixes, open a pull request directly and explain the change clearly.

## Development setup

Install these tools on both platforms:

- Node.js 22
- npm
- Rust and Cargo

### Linux (Ubuntu LTS)

Install Tauri's required system dependencies:

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

### Windows

Install:

- Node.js 22
- Rust using the MSVC toolchain
- Microsoft Visual Studio Build Tools, with the **Desktop development with C++** workload
- WebView2 Runtime, which is included with current Windows 10 and Windows 11 installations

Open an MSVC x64 Developer PowerShell for native packaging work.

### Install and run

From the repository root:

```bash
npm ci
npm run tauri:dev
```

Use `npm run tauri:dev` to test the real desktop application. The workspace window and citrus wheel use the same local Tauri host and native functions; `npm run dev` is only a browser renderer preview and cannot validate native behavior.

## Debugging

Santra writes session logs and failure diagnostics on the local device:

```text
~/.santra/logs
```

On Windows, this resolves to:

```text
%USERPROFILE%\.santra\logs
```

Review the newest plain-text log when reporting or investigating a failure. Do not include user file contents, filenames, or full paths in issues or pull requests.

## Validate your changes

Run the narrowest relevant check first, then broader checks when practical:

```bash
npm run typecheck
npm run test
npm run build
```

For UI changes, also run the relevant Playwright or desktop checks. Verify global drag behavior manually with a real file-manager drag on the platform you changed.

## Create desktop packages

Build packages on their native platform after the validation checks pass.

### Linux: Debian package and AppImage

On Ubuntu LTS x64, build both packages with:

```bash
npm run dist:linux
```

Build only the Debian package with:

```bash
npx tauri build --bundles deb
```

Build only the AppImage with:

```bash
npx tauri build --bundles appimage
```

The artifacts are created under `src-tauri/target/release/bundle/`:

```text
src-tauri/target/release/bundle/deb/Santra_<version>_amd64.deb
src-tauri/target/release/bundle/appimage/Santra_<version>_amd64.AppImage
```

### Windows: NSIS installer

On Windows x64, open an **x64 Native Tools Command Prompt for Visual Studio 2022** and run:

```powershell
npm run dist:windows
```

The installer is created at:

```text
src-tauri\target\release\bundle\nsis\Santra_<version>_x64-setup.exe
```

Run `npm run check:release` before packaging and `npm run release:report` afterwards to record the produced artifacts. Do not claim a package is release-ready until native installation, launch, and relevant file-manager behavior have been tested.

## Pull requests

Keep one focused purpose per pull request. Include:

- A clear description of the change and its user impact.
- Validation you ran and its result.
- Documentation updates when behavior or supported capabilities change.
- A screenshot or short video for every UI change.

To close an issue when the pull request is merged, include a closing keyword and issue number in the pull request description, for example:

```text
Fixes #123
```

Do not use a closing keyword for issues that the pull request does not fully resolve.

## Project constraints

- Keep processing local and offline-first. Do not add accounts, uploads, analytics, cloud conversion, or telemetry by default.
- Keep the application lightweight. Do not add a dependency merely to solve a small or isolated problem; first use an existing project abstraction, a standard-library capability, or a small local implementation. Add a package only when it provides clear, ongoing value that outweighs its size, maintenance, security, and packaging cost. If the tradeoff is unclear, ask a maintainer before adding it.
- Preserve source files by default and never overwrite them silently.
- Treat all input files as untrusted; never execute them.
- Follow the detailed rules in [AGENTS.md](AGENTS.md), including capability checks, safe outputs, and documentation requirements.

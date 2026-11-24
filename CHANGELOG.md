# Changelog

All notable changes to Santra are recorded here. Entries are grouped under
new features, fixes, breaking changes and refactors. Every pull request adds
its own entries before review.

## Unreleased

### New features

- Added a theme picker in Settings with Light, Dark, Match system, Catppuccin
  Mocha, Dracula, Tokyo Night, Monokai, Nord and Gruvbox Dark. The palette
  applies to the workspace, the citrus wheel, compact editors and Quick Preview.
- Clicking a wheel slice now commits the choice immediately. Conversions open
  in the output panel with the selected format, tools open their editor, and
  file actions run without a second confirmation.
- Native Windows drops now resolve the slice under the pointer, so dropping on
  JPG selects JPG and opens the output panel instead of reopening the picker.
- Unselected or failed global-wheel drops now return the inspected files to the
  workspace with the matching picker tab and any local error notice.
- Added this changelog and a contributor rule to keep it current for every PR.

### Fixes

- Removed the transparent ghost windows painted during a cold launch. The wheel
  webview is created on first use and remains hidden until the renderer reports
  its first frame.
- Removed the remaining white timeline, waveform, spreadsheet and compact-window
  surfaces in dark palettes so text stays readable in every editor.
- The Appearance setting is no longer forced to Light. The saved theme is
  applied on startup and persists across restarts.
- Clicking a wheel slice previously only highlighted it, which made double-tap
  Shift feel like it had no effect. It now selects the operation directly.
- A native drop on a slice ignored the pointer and reopened "Choose an
  operation". It now uses the hovered slice.
- The workspace global-file listener no longer re-subscribes while capabilities
  load, so a handoff that arrives during startup is not dropped.
- A global-wheel route failure now hands the files back for review instead of
  discarding the selection behind a background notice.
- A failed or unavailable global operation now reports a local notice and keeps
  the files available.

### Breaking changes

- Theme values are now named palettes: `system`, `light`, `dark`, `catppuccin`,
  `dracula`, `tokyo-night`, `monokai`, `nord` and `gruvbox`. Unknown values are
  rejected by the host and fall back to Light in the renderer.
- The wheel window is created on demand instead of at launch. The first open
  may take slightly longer while the webview loads.
- Light remains the default for new and existing profiles. Choosing Match
  system is now opt-in.

### Refactors

- Added `src/common/theme.ts` as the single theme catalog and applier, plus
  `src/common/themes.css` for shared palette tokens and component overrides.
- Auxiliary wheel creation now goes through the existing lazy-window helper and
  a renderer readiness signal, matching the other compact windows.
- The workspace and global wheel share the same slice-selection rules for
  clicks, native drops and DOM drops.
- The workspace keeps one stable subscription for global files, operations,
  page changes and notices.

## 0.1.0 preview fixes

### Fixes

- Detect local engines after Tauri manages application state, so the first
  snapshot no longer reports zero engines.
- Allow the Tauri IPC host in the content security policy, avoiding failed
  fetches and fallback to the slower postMessage bridge.
- Report the real platform in the status bar after settings updates.
- Create image, video, audio, PDF and spreadsheet windows on demand instead of
  during startup.
- Retry the first workspace snapshot while the host finishes starting.
- Import the MSVC environment when `cl.exe` is installed but not on `PATH`.
- Document the Visual Studio Build Tools and npm 12 remote-package setup needed
  for Windows builds.
- Add timestamped local failure logs.

## 0.1.0 preview

### New features

- Local conversion queue with detected FFmpeg, Office, Poppler, qpdf and
  ExifTool routes.
- Citrus wheel with configurable double-tap shortcuts for conversion, tools and
  file actions.
- Compact image, video, audio, PDF and spreadsheet editors.
- Native Windows drag watcher and optional GNOME Shell integration.
- Source-preserving output with collision handling, atomic writes and path
  traversal protection.

export type ThemeTone = 'light' | 'dark';

export interface ThemeOption {
  id: string;
  label: string;
  tone: ThemeTone;
}

/**
 * Every theme is a named palette. "system" resolves to light or dark at paint
 * time, so the stored preference stays stable when the operating system theme
 * changes.
 */
export const themeOptions: ThemeOption[] = [
  { id: 'system', label: 'Match system', tone: 'light' },
  { id: 'light', label: 'Light', tone: 'light' },
  { id: 'dark', label: 'Dark', tone: 'dark' },
  { id: 'catppuccin', label: 'Catppuccin Mocha', tone: 'dark' },
  { id: 'dracula', label: 'Dracula', tone: 'dark' },
  { id: 'tokyo-night', label: 'Tokyo Night', tone: 'dark' },
  { id: 'monokai', label: 'Monokai', tone: 'dark' },
  { id: 'nord', label: 'Nord', tone: 'dark' },
  { id: 'gruvbox', label: 'Gruvbox Dark', tone: 'dark' },
];

const knownThemes = new Set(themeOptions.map(option => option.id));

export function normalizeTheme(value?: string): string {
  return value && knownThemes.has(value) ? value : 'light';
}

function paint(preference: string) {
  const root = document.documentElement;
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const id = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const option = themeOptions.find(item => item.id === id) ?? themeOptions[1];
  root.dataset.theme = id;
  root.dataset.themePreference = preference;
  root.dataset.themeTone = option.tone;
  root.style.colorScheme = option.tone;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', option.tone === 'dark' ? '#141512' : '#faf9f6');
}

/**
 * Applies a stored theme preference to the document. Returns a cleanup for the
 * system-preference listener, so callers can safely re-run it when settings
 * change.
 */
export function applyTheme(value?: string): () => void {
  const preference = normalizeTheme(value);
  paint(preference);
  if (preference !== 'system' || !window.matchMedia) return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => paint(preference);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

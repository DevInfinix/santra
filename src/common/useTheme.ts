import { useEffect } from 'react';
import { api } from './bridge';
import { applyTheme } from './theme';

/**
 * Applies the saved theme inside compact windows that do not receive the full
 * workspace snapshot. The workspace itself applies changes from live settings.
 */
export function useTheme() {
  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    const read = api.currentTheme
      ? api.currentTheme()
      : api.bootstrap().then(snapshot => snapshot.settings.theme);
    void read
      .then(theme => { if (active) stop = applyTheme(theme); })
      .catch(() => { if (active) stop = applyTheme('light'); });
    return () => { active = false; stop?.(); };
  }, []);
}

// How her settings reach the page: the theme as `data-theme` on <html> (the
// theme tokens in theme.css follow it), and the Spanish names of each choice.

import { ETheme, NAME_MAX_LENGTH, THEMES } from '../domain/settings'

export { ETheme, NAME_MAX_LENGTH, THEMES }

export const THEME_LABELS: Readonly<Record<ETheme, string>> = {
  [ETheme.System]: 'Sistema',
  [ETheme.Light]: 'Claro',
  [ETheme.Dark]: 'Oscuro',
}

/** Sets the page's theme: no attribute follows the device, `light` or `dark` forces one. */
export function applyTheme(theme: ETheme, root: HTMLElement = document.documentElement): void {
  if (theme === ETheme.System) root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

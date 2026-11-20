/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Build-time switch for the official questions (the Instituto Cervantes
   * manual). Unset or anything but "false": included. "false": left out of the
   * build entirely — for a public site such as the GitHub Pages test site.
   */
  readonly VITE_OFFICIAL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

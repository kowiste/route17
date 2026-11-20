import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const mainCSS = readFileSync(resolve(import.meta.dirname, 'main.css'), 'utf8')

describe('main.css', () => {
  it('shows the pointing hand on enabled buttons and other clickable elements', () => {
    const rule = /@layer base\s*{([^}]*{[^}]*})/.exec(mainCSS)?.[1] ?? ''
    expect(rule).toContain('button:not(:disabled)')
    expect(rule).toContain("[role='button']:not([aria-disabled='true'])")
    expect(rule).toContain('cursor: pointer')
  })
})

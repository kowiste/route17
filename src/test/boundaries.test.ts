// The architecture's import rules, checked on every test run:
// - domain/, app/ and contracts/ are plain TypeScript: no Vue, no Pinia, no
//   router, no UI kit, no browser globals, no browser storage;
// - a feature never imports another feature's internals, only contracts/
//   (bootstrap/ wires everything and is exempt; tests are exempt).

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = resolve(import.meta.dirname, '..')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

function isTest(path: string): boolean {
  return /\.test\.ts$/.test(path) || path.includes(`${sep}test${sep}`)
}

const sources = walk(SRC)
  .filter((path) => /\.(ts|vue)$/.test(path))
  .filter((path) => !isTest(path))
  .map((path) => ({
    path: relative(SRC, path).split(sep).join('/'),
    text: readFileSync(path, 'utf8'),
  }))

function importsOf(text: string): string[] {
  return [...text.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/g)].map(
    (match) => match[1] ?? ''
  )
}

const PURE_LAYER = /^(contracts\/|features\/[^/]+\/(domain|app)\/)/
const FORBIDDEN_IMPORTS = [
  /^vue$/,
  /^pinia$/,
  /^vue-router$/,
  /^@\/shared\/(ui|sound|storage)(\/|$)/,
  /\.vue$/,
]
const FORBIDDEN_GLOBALS = /\b(window|document|localStorage|sessionStorage|navigator)\s*\./

describe('architecture boundaries', () => {
  it('keeps domain/, app/ and contracts/ free of Vue, the UI and the browser', () => {
    const problems = sources
      .filter((source) => PURE_LAYER.test(source.path))
      .flatMap((source) => [
        ...importsOf(source.text)
          .filter((spec) => FORBIDDEN_IMPORTS.some((rule) => rule.test(spec)))
          .map((spec) => `${source.path} imports ${spec}`),
        ...(FORBIDDEN_GLOBALS.test(source.text) ? [`${source.path} uses a browser global`] : []),
      ])
    expect(problems).toEqual([])
  })

  it('never lets a feature import another feature', () => {
    const problems = sources.flatMap((source) => {
      const own = /^features\/([^/]+)\//.exec(source.path)?.[1]
      if (own === undefined) return []
      return importsOf(source.text)
        .map((spec) => /^@\/features\/([^/]+)\//.exec(spec)?.[1])
        .filter((other): other is string => other !== undefined && other !== own)
        .map((other) => `${source.path} imports feature ${other}`)
    })
    expect(problems).toEqual([])
  })

  it('never lets contracts/ or shared/ import a feature', () => {
    const problems = sources
      .filter((source) => /^(contracts|shared)\//.test(source.path))
      .flatMap((source) =>
        importsOf(source.text)
          .filter((spec) => spec.startsWith('@/features/'))
          .map((spec) => `${source.path} imports ${spec}`)
      )
    expect(problems).toEqual([])
  })
})

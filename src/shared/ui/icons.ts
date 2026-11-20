// The kit's pixel icons, drawn like the sprites: rows of characters, '#' a
// pixel, '.' empty. PixelIcon draws them as SVG in the current text colour.

export enum EPixelIcon {
  Check = 'check',
  Cross = 'cross',
  Info = 'info',
  Phone = 'phone',
  Half = 'half',
  Audience = 'audience',
  Cursor = 'cursor',
  Flag = 'flag',
  Star = 'star',
  SoundOn = 'sound-on',
  SoundOff = 'sound-off',
}

export const PIXEL_ICONS: Readonly<Record<EPixelIcon, readonly string[]>> = {
  [EPixelIcon.Check]: [
    '........',
    '......##',
    '.....###',
    '##..###.',
    '######..',
    '.####...',
    '..##....',
    '........',
  ],
  [EPixelIcon.Cross]: [
    '##....##',
    '###..###',
    '.######.',
    '..####..',
    '..####..',
    '.######.',
    '###..###',
    '##....##',
  ],
  [EPixelIcon.Info]: [
    '..#####..',
    '.###.###.',
    '#########',
    '###..####',
    '####.####',
    '####.####',
    '###...###',
    '.#######.',
    '..#####..',
  ],
  [EPixelIcon.Phone]: [
    '.#######.',
    '#########',
    '##.....##',
    '...###...',
    '..#####..',
    '.##.#.##.',
    '.#######.',
    '.##.#.##.',
    '.#######.',
  ],
  [EPixelIcon.Half]: [
    '########',
    '#...####',
    '#...####',
    '#...####',
    '#...####',
    '#...####',
    '#...####',
    '########',
  ],
  [EPixelIcon.Audience]: [
    '......##',
    '......##',
    '...##.##',
    '...##.##',
    '##.##.##',
    '##.##.##',
    '##.##.##',
    '########',
  ],
  [EPixelIcon.Cursor]: ['#....', '##...', '###..', '####.', '###..', '##...', '#....'],
  [EPixelIcon.Flag]: [
    '##.....',
    '#####..',
    '#######',
    '#####..',
    '##.....',
    '#......',
    '#......',
    '#......',
  ],
  [EPixelIcon.Star]: [
    '....#....',
    '....#....',
    '...###...',
    '#########',
    '.#######.',
    '..#####..',
    '..##.##..',
    '.##...##.',
    '.#.....#.',
  ],
  [EPixelIcon.SoundOn]: [
    '...#..#..',
    '..##...#.',
    '####.#.#.',
    '####.#.#.',
    '..##...#.',
    '...#..#..',
  ],
  [EPixelIcon.SoundOff]: [
    '...#.....',
    '..##.#.#.',
    '####..#..',
    '####.#.#.',
    '..##.....',
    '...#.....',
  ],
}

export interface IconShape {
  readonly width: number
  readonly height: number
  /** An SVG path: one rectangle per run of pixels in a row. */
  readonly path: string
}

/** The SVG shape of an icon. */
export function iconShape(icon: EPixelIcon): IconShape {
  const rows = PIXEL_ICONS[icon]
  const parts: string[] = []
  rows.forEach((row, y) => {
    for (const match of row.matchAll(/#+/g)) {
      parts.push(`M${match.index} ${y}h${match[0].length}v1h-${match[0].length}z`)
    }
  })
  return { width: rows[0]?.length ?? 0, height: rows.length, path: parts.join('') }
}

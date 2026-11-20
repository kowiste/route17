// The "17" on the logo's road sign, as blocky pixel digits. The pixel font's 7
// reads poorly at logo size, so the number is drawn as pixels instead.

/** One horizontal run of filled pixels: one <rect>. */
export interface PixelRun {
  readonly x: number
  readonly y: number
  readonly width: number
}

/** The sign's digits, 6×9 pixels each, with 2-pixel strokes. */
export const SIGN_DIGITS: Readonly<Record<'1' | '7', readonly string[]>> = {
  '1': ['..##..', '.###..', '####..', '..##..', '..##..', '..##..', '..##..', '..##..', '######'],
  '7': ['######', '######', '....##', '....##', '...##.', '...##.', '..##..', '..##..', '..##..'],
}

const DIGIT_WIDTH = 6
const DIGIT_GAP = 2

export const SIGN_NUMBER_WIDTH = DIGIT_WIDTH * 2 + DIGIT_GAP
export const SIGN_NUMBER_HEIGHT = 9

/** The filled pixels of "17" as horizontal runs. */
function signRuns(): PixelRun[] {
  const glyphs = [SIGN_DIGITS['1'], SIGN_DIGITS['7']]
  return glyphs.flatMap((rows, digit) =>
    rows.flatMap((row, y) => {
      const runs: PixelRun[] = []
      let start = -1
      for (let x = 0; x <= row.length; x++) {
        const filled = row[x] === '#'
        if (filled && start < 0) start = x
        if (!filled && start >= 0) {
          runs.push({ x: digit * (DIGIT_WIDTH + DIGIT_GAP) + start, y, width: x - start })
          start = -1
        }
      }
      return runs
    })
  )
}

export const SIGN_RUNS: readonly PixelRun[] = signRuns()

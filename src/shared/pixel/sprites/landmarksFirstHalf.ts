// The landmarks of the route's first half, Canarias to Navarra. 16 × 16 each,
// transparent around them; o is always the outline.

import type { Sprite } from '../sprite'

/** El Teide over its sea of clouds. */
export const TEIDE: Sprite = {
  rows: [
    '................',
    '................',
    '.......oo.......',
    '......owwo......',
    '.....owwwWo.....',
    '.....owwWWo.....',
    '....owrwwWRo....',
    '....orrrwRRo....',
    '...orrrrrrRRo...',
    '...orrrrrrRRo...',
    '..occcccrrRRRo..',
    '.owwwwwwccrRRRo.',
    '.occcccrrrrRRRo.',
    'orrrrrrrrrrRRRRo',
    'oggrrrgrrrrRRggo',
    'oooooooooooooooo',
  ],
  legend: {
    o: 'outline',
    w: 'snow',
    W: 'greyLight',
    r: 'earth',
    R: 'earthDark',
    c: 'white',
    g: 'forest',
  },
}

/** La Giralda, with the Giraldillo on top. */
export const GIRALDA: Sprite = {
  rows: [
    '.......oo.......',
    '......ogGo......',
    '.......oo.......',
    '......occo......',
    '......ocCo......',
    '.....occcCo.....',
    '.....okckCo.....',
    '....occcccCo....',
    '....okckckCo....',
    '....occcccCo....',
    '....obpbbpBo....',
    '....obbkkbBo....',
    '....opbbbbpo....',
    '....obbkkbBo....',
    '....obpbbpBo....',
    '...oooooooooo...',
  ],
  legend: {
    o: 'outline',
    g: 'gold',
    G: 'yellow',
    c: 'cream',
    C: 'stoneDark',
    k: 'greyDark',
    b: 'earthLight',
    B: 'sandDark',
    p: 'brick',
  },
}

/** The cathedral of Murcia: its bell tower and baroque front. */
export const MURCIA_CATHEDRAL: Sprite = {
  rows: [
    '...o............',
    '..oyo...........',
    '...o............',
    '..occo..........',
    '.occcCo.........',
    'occccCCo........',
    'oooooooo........',
    'ockcckCo...oo...',
    'occccccoo.oyyo..',
    'ockcckCooocccCo.',
    'occccccoccccccCo',
    'oooooooocckkccCo',
    'ockcckCocokkocCo',
    'occccccocokkocCo',
    'occccccocokkocCo',
    'oooooooooooooooo',
  ],
  legend: {
    o: 'outline',
    y: 'gold',
    c: 'stone',
    C: 'stoneDark',
    k: 'greyDark',
  },
}

/** L'Hemisfèric of the Ciudad de las Artes y las Ciencias, mirrored in its pool. */
export const ARTES_Y_CIENCIAS: Sprite = {
  rows: [
    '................',
    '................',
    '..........oo....',
    '.........owwo...',
    '........owwo....',
    '.....ooowwoo....',
    '...oowwwwwwwoo..',
    '..owwWbbbbbWwwo.',
    '.owWbbbBBbbbbWwo',
    '.owWWbbbbbbbWWwo',
    '..oowwwwwwwwwoo.',
    'aaaaoooooooooaaa',
    'aAAaaWWWWWWWaaAa',
    'aaaAaaabbbaaaAaa',
    'AaaaaaaaaaaaaaaA',
    '................',
  ],
  legend: {
    o: 'outline',
    w: 'white',
    W: 'greyLight',
    b: 'teal',
    B: 'tealDark',
    a: 'seaLight',
    A: 'sea',
  },
}

/** La Seu, the cathedral of Palma, over the sea wall. */
export const PALMA_CATHEDRAL: Sprite = {
  rows: [
    '.....o....o.....',
    '....oso..oso....',
    '.o..oso..oso..o.',
    'oso.osooooso.oso',
    'oso.ososssso.oso',
    'osoooosyyysoooso',
    'ossssosykysossSo',
    'ossssosyyysossSo',
    'okskkossssskskSo',
    'okskkosskssksSSo',
    'okskkosskssksSSo',
    'ossssosskssssSSo',
    'oooooooooooooooo',
    'oddddddddddddddo',
    'aaaAaaaaaaAaaaaa',
    '.AaaaaAaaaaaaAa.',
  ],
  legend: {
    o: 'outline',
    s: 'sand',
    S: 'sandDark',
    y: 'yellow',
    k: 'brickDark',
    d: 'stoneDark',
    a: 'sea',
    A: 'seaLight',
  },
}

/** La Sagrada Família: its spires, with the coloured pinnacles. */
export const SAGRADA_FAMILIA: Sprite = {
  rows: [
    '.....y....y.....',
    '....oro..oro....',
    '....oso..oso....',
    '.y..oso..oso..y.',
    'oro.oso..oso.oro',
    'oso.osSooSso.oso',
    'oso.oksooSko.oso',
    'oSo.osSooSso.oSo',
    'oso.oksooSko.oso',
    'osSoosSooSsoosSo',
    'osssssssssssssSo',
    'ossskssskkssskSo',
    'osssssskkkksssSo',
    'osskksskkkksskSo',
    'osskksskkkksskSo',
    'oooooooooooooooo',
  ],
  legend: { o: 'outline', r: 'orange', y: 'yellow', s: 'stone', S: 'stoneDark', k: 'earthDark' },
}

/** The Basílica del Pilar: its tiled domes and corner towers. */
export const PILAR: Sprite = {
  rows: [
    '.o............o.',
    'oyo....oo....oyo',
    'oto...oyyo...oto',
    'oto...oggo...oto',
    'oto..ogywgo..oto',
    'oto.ogbgygbo.oto',
    'otooggywygyggoto',
    'otooooooooooooto',
    'otobbbbbbbbbboto',
    'otobkbbkkbbkboto',
    'otobkbbkkbbkboto',
    'otobbbbbbbbbboto',
    'otobkbbkkbbkboto',
    'otobkbbkkbbkboto',
    'otobbbbkkbbbboto',
    'oooooooooooooooo',
  ],
  legend: {
    o: 'outline',
    y: 'yellow',
    g: 'grass',
    w: 'white',
    b: 'brick',
    t: 'earthLight',
    k: 'brickDark',
  },
}

/** San Fermín: a running bull with the red pañuelo round its neck. */
export const SAN_FERMIN: Sprite = {
  rows: [
    '................',
    '................',
    '................',
    'w..w............',
    'wo.wo...........',
    '.ow.oooooooooo..',
    '.okkokKKkkkkkkoo',
    'okkkrkKkkkkkkkko',
    'okekrkkkkkkkkko.',
    'okkkrrkkkkkkkko.',
    '.ooorkkkkkkkkko.',
    '...okkookkookko.',
    '...okko.okko.ko.',
    '...oko..oko..oo.',
    '...ooo..ooo.....',
    '................',
  ],
  legend: {
    o: 'outline',
    w: 'cream',
    k: 'black',
    K: 'greyDark',
    e: 'white',
    r: 'red',
  },
}

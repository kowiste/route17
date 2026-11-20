// The landmarks of the route's second half, La Rioja to Madrid. 16 × 16 each,
// transparent around them; o is always the outline.

import type { Sprite } from '../sprite'

/** A wine barrel with a bunch of grapes. */
export const RIOJA_WINE: Sprite = {
  rows: [
    '..........oo....',
    '.........ogGo...',
    '.......oooNoo...',
    '......opPpPpo...',
    '.......opPpPo...',
    '...oooooopPo....',
    '..onnnnnnoo.....',
    '.oggggggggggo...',
    '.onlnnnnnnNNo...',
    'onlnnnnnnnnNNo..',
    'oggggggggggggo..',
    'onlnnnnnnnnNNo..',
    '.onlnnnnnnNNo...',
    '.oggggggggggo...',
    '..onnnnnnnNo....',
    '...oooooooo.....',
  ],
  legend: {
    o: 'outline',
    g: 'grey',
    G: 'grass',
    N: 'earthDark',
    n: 'earth',
    l: 'earthLight',
    p: 'purple',
    P: 'purpleDark',
  },
}

/** The Guggenheim of Bilbao: curves of titanium by the river. */
export const GUGGENHEIM: Sprite = {
  rows: [
    '................',
    '.......oooo.....',
    '......owwllo....',
    '..ooo.owlllgo...',
    '.owwlooowllgo...',
    'owllllgoowlggo..',
    'owwwwllgoowlgo.o',
    'oolllllggoowgoto',
    'owwwwwlllgoogoto',
    'owlllllllgggggto',
    'oolllgggggggggto',
    'oooooooooooooooo',
    'aaaAaaaaaaAaaaaa',
    'AaaaaaAaaaaaaAaa',
    '................',
    '................',
  ],
  legend: {
    o: 'outline',
    w: 'white',
    l: 'greyLight',
    g: 'grey',
    t: 'seaLight',
    a: 'sea',
    A: 'seaLight',
  },
}

/** A bison of the cave of Altamira, in red ochre on the rock. */
export const ALTAMIRA: Sprite = {
  rows: [
    '................',
    '.oooooooooooooo.',
    'occccccccccccCco',
    'occccckkkkcccCco',
    'occckkrrrrkkccCo',
    'ocwkrrRrrrrrkcCo',
    'ockkrRRrrrrrrkCo',
    'okkrrRrrrrrrrkCo',
    'okkkrrrrrrrrkcCo',
    'ocokkrrkkkrkkcCo',
    'occckckcccckcCCo',
    'occckckccckcCCCo',
    'occcccccccccCCCo',
    'oCcccccccCCCCCCo',
    '.oooooooooooooo.',
    '................',
  ],
  legend: {
    o: 'outline',
    c: 'stone',
    C: 'stoneDark',
    r: 'ochre',
    R: 'brickDark',
    k: 'black',
    w: 'cream',
  },
}

/** An Asturian hórreo: a wooden granary on stone feet. */
export const HORREO: Sprite = {
  rows: [
    '................',
    '.......oo.......',
    '......orro......',
    '.....orrrRo.....',
    '....orrrrRRo....',
    '...orrrrrRRRo...',
    '..orrrrrrRRRRo..',
    '.oooooooooooooo.',
    '..onnnnnnnnNNo..',
    '..onNnNnNnNnNo..',
    '..onnnnnnnnNNo..',
    '..onNnNnNnNnNo..',
    '.oggggggggggggo.',
    '..ogo......ogo..',
    '..ogo......ogo..',
    '.ooooo....ooooo.',
  ],
  legend: {
    o: 'outline',
    r: 'brick',
    R: 'brickDark',
    n: 'earth',
    N: 'earthDark',
    g: 'rock',
  },
}

/** The Obradoiro front of the cathedral of Santiago: two towers. */
export const SANTIAGO_CATHEDRAL: Sprite = {
  rows: [
    '..o.........o...',
    '.ogo.......ogo..',
    '.ogo.......ogo..',
    'oggGo.....oggGo.',
    'okgko.....okgko.',
    'oggGo..o..oggGo.',
    'okgkoooggoookgko',
    'oggGoggkkGgoggGo',
    'okgkogkkkkGokgko',
    'oggGogkmmkGoggGo',
    'okgkogkkkkGokgko',
    'oggGoggggGGoggGo',
    'omgGoggkkGGomgGo',
    'oggGoggkkGGoggGo',
    'oggmoggkkGGoggmo',
    'oooooooooooooooo',
  ],
  legend: {
    o: 'outline',
    g: 'greyLight',
    G: 'grey',
    k: 'greyDark',
    m: 'grassDark',
  },
}

/** The aqueduct of Segovia: two rows of granite arches. */
export const SEGOVIA_AQUEDUCT: Sprite = {
  rows: [
    '................',
    '................',
    'oooooooooooooooo',
    'osssssssssssssss',
    'oSSSSSSSSSSSSSSS',
    'oso..oso..oso..o',
    'oso..oso..oso..o',
    'osoooosoooosoooo',
    'osssssssssssssss',
    'oSoo.oSoo.oSoo.o',
    'oso..oso..oso..o',
    'oso..oso..oso..o',
    'oso..oso..oso..o',
    'oso..oso..oso..o',
    'oSo..oSo..oSo..o',
    'ooo..ooo..ooo..o',
  ],
  legend: { o: 'outline', s: 'stone', S: 'stoneDark' },
}

/** The Roman theatre of Mérida: two rows of marble columns. */
export const MERIDA_THEATRE: Sprite = {
  rows: [
    '................',
    '..oooooooooooo..',
    '..occcccccccco..',
    '..owWkwWkwWkwo..',
    '..owWkwWkwWkwo..',
    'oooooooooooooooo',
    'occccccccccccCCo',
    'okwWkwWkkwWkwWko',
    'okwWkwWkkwWkwWko',
    'okwWkwWkkwWkwWko',
    'okwWkwWkkwWkwWko',
    'okwWkwWkkwWkwWko',
    'occccccccccccCCo',
    'oCCCCCCCCCCCCCCo',
    'oooooooooooooooo',
    '................',
  ],
  legend: { o: 'outline', c: 'stone', C: 'stoneDark', w: 'white', W: 'greyLight', k: 'brickDark' },
}

/** A windmill of La Mancha on its hill. */
export const WINDMILL: Sprite = {
  rows: [
    'o.............o.',
    'ono..........ono',
    '.ono..oo....ono.',
    '..ono.ooo..ono..',
    '...onooRRoono...',
    '....onoRRRno....',
    '....oonnnnoo....',
    '...ono.wwono....',
    '..ono.owwwoono..',
    '.ono..owwWo.ono.',
    'ono...owkwo..ono',
    'oo....owwWo...oo',
    '......owwWo.....',
    '....oowwwWWoo...',
    '..ooggggggggggoo',
    'oogggggggGGGGGGo',
  ],
  legend: {
    o: 'outline',
    n: 'earthDark',
    R: 'greyDark',
    w: 'white',
    W: 'greyLight',
    k: 'blueDark',
    g: 'grass',
    G: 'grassDark',
  },
}

/** La Puerta de Alcalá: three arches and two square gates. */
export const PUERTA_DE_ALCALA: Sprite = {
  rows: [
    '................',
    '.......oo.......',
    '..o...occo...o..',
    '.oco.occcCo.oco.',
    '.ocooccccCCooco.',
    'oooooooooooooooo',
    'occccccccccccCCo',
    'oooooooooooooooo',
    'occcoocccoocccCo',
    'ocooko.oko.okooo',
    'ocokkkokkkokkkCo',
    'ocokkkokkkokkkCo',
    'ocokkkokkkokkkCo',
    'occcccccccccccCo',
    'oCCCCCCCCCCCCCCo',
    'oooooooooooooooo',
  ],
  legend: { o: 'outline', c: 'stone', C: 'stoneDark', k: 'greyDark' },
}

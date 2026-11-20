// The 17 comunidades autónomas: one per rung of a round.

export enum EComunidadID {
  Andalucia = 'andalucia',
  Aragon = 'aragon',
  Asturias = 'asturias',
  Baleares = 'baleares',
  Canarias = 'canarias',
  Cantabria = 'cantabria',
  CastillaLaMancha = 'castilla-la-mancha',
  CastillaYLeon = 'castilla-y-leon',
  Cataluna = 'cataluna',
  Valenciana = 'valenciana',
  Extremadura = 'extremadura',
  Galicia = 'galicia',
  Madrid = 'madrid',
  Murcia = 'murcia',
  Navarra = 'navarra',
  PaisVasco = 'pais-vasco',
  Rioja = 'rioja',
}

export interface ComunidadInfo {
  /** ISO 3166-2:ES code without the country: `AN`, `MD`… Fits on a small map tile. */
  readonly code: string
  /** The everyday name: "Asturias", "Baleares". */
  readonly shortName: string
  /** The official name: "Principado de Asturias", "Illes Balears". */
  readonly fullName: string
  /** Its capital. */
  readonly capital: string
}

export const COMUNIDADES: Readonly<Record<EComunidadID, ComunidadInfo>> = {
  [EComunidadID.Andalucia]: {
    code: 'AN',
    shortName: 'Andalucía',
    fullName: 'Andalucía',
    capital: 'Sevilla',
  },
  [EComunidadID.Aragon]: {
    code: 'AR',
    shortName: 'Aragón',
    fullName: 'Aragón',
    capital: 'Zaragoza',
  },
  [EComunidadID.Asturias]: {
    code: 'AS',
    shortName: 'Asturias',
    fullName: 'Principado de Asturias',
    capital: 'Oviedo',
  },
  [EComunidadID.Baleares]: {
    code: 'IB',
    shortName: 'Baleares',
    fullName: 'Illes Balears',
    capital: 'Palma',
  },
  [EComunidadID.Canarias]: {
    code: 'CN',
    shortName: 'Canarias',
    fullName: 'Canarias',
    capital: 'Santa Cruz de Tenerife y Las Palmas de Gran Canaria',
  },
  [EComunidadID.Cantabria]: {
    code: 'CB',
    shortName: 'Cantabria',
    fullName: 'Cantabria',
    capital: 'Santander',
  },
  [EComunidadID.CastillaLaMancha]: {
    code: 'CM',
    shortName: 'Castilla-La Mancha',
    fullName: 'Castilla-La Mancha',
    capital: 'Toledo',
  },
  [EComunidadID.CastillaYLeon]: {
    code: 'CL',
    shortName: 'Castilla y León',
    fullName: 'Castilla y León',
    capital: 'Valladolid',
  },
  [EComunidadID.Cataluna]: {
    code: 'CT',
    shortName: 'Cataluña',
    fullName: 'Cataluña',
    capital: 'Barcelona',
  },
  [EComunidadID.Valenciana]: {
    code: 'VC',
    shortName: 'C. Valenciana',
    fullName: 'Comunitat Valenciana',
    capital: 'Valencia',
  },
  [EComunidadID.Extremadura]: {
    code: 'EX',
    shortName: 'Extremadura',
    fullName: 'Extremadura',
    capital: 'Mérida',
  },
  [EComunidadID.Galicia]: {
    code: 'GA',
    shortName: 'Galicia',
    fullName: 'Galicia',
    capital: 'Santiago de Compostela',
  },
  [EComunidadID.Madrid]: {
    code: 'MD',
    shortName: 'Madrid',
    fullName: 'Comunidad de Madrid',
    capital: 'Madrid',
  },
  [EComunidadID.Murcia]: {
    code: 'MC',
    shortName: 'Murcia',
    fullName: 'Región de Murcia',
    capital: 'Murcia',
  },
  [EComunidadID.Navarra]: {
    code: 'NC',
    shortName: 'Navarra',
    fullName: 'Comunidad Foral de Navarra',
    capital: 'Pamplona',
  },
  [EComunidadID.PaisVasco]: {
    code: 'PV',
    shortName: 'País Vasco',
    fullName: 'País Vasco',
    capital: 'Vitoria-Gasteiz',
  },
  [EComunidadID.Rioja]: {
    code: 'RI',
    shortName: 'La Rioja',
    fullName: 'La Rioja',
    capital: 'Logroño',
  },
}

/**
 * Place vocabulary shared by the jobs board (location tiers) and the resume
 * importer (a bare city on a contact row): countries with the names the feeds
 * use for them, wider regions, and the cities the feeds actually publish.
 */

/**
 * Country → the names the feeds use for it (Remotive/Jobicy geo labels and the
 * city-board wording seen in Arbeitnow). Keys are the display labels.
 */
export const COUNTRY_ALIASES: Record<string, string[]> = {
  UK: ['uk', 'united kingdom', 'great britain', 'britain', 'england', 'scotland', 'wales', 'royaume-uni'],
  USA: ['usa', 'united states', 'u.s.', 'us only', 'usa timezones'],
  Canada: ['canada'],
  France: ['france', 'île-de-france', 'ile-de-france', 'auvergne-rhône-alpes'],
  Germany: ['germany', 'deutschland', 'remote de'],
  Spain: ['spain', 'españa'],
  Netherlands: ['netherlands', 'the netherlands', 'holland'],
  Switzerland: ['switzerland', 'schweiz', 'suisse'],
  Ireland: ['ireland'],
  Italy: ['italy', 'italia'],
  Poland: ['poland', 'polska'],
  Portugal: ['portugal'],
  Sweden: ['sweden'],
  Norway: ['norway'],
  Austria: ['austria', 'österreich'],
  Czechia: ['czechia', 'czech republic'],
  Hungary: ['hungary'],
  Romania: ['romania'],
  Bulgaria: ['bulgaria'],
  Croatia: ['croatia'],
  Ukraine: ['ukraine'],
  Israel: ['israel'],
  UAE: ['uae', 'united arab emirates', 'dubai'],
  Mexico: ['mexico', 'méxico'],
  Brazil: ['brazil', 'brasil'],
  Argentina: ['argentina'],
  'Costa Rica': ['costa rica'],
  Australia: ['australia'],
  'New Zealand': ['new zealand'],
  Singapore: ['singapore'],
  Japan: ['japan'],
  'South Korea': ['south korea', 'korea'],
  China: ['china'],
  'Hong Kong': ['hong kong'],
  Philippines: ['philippines'],
  Thailand: ['thailand'],
  Vietnam: ['vietnam'],
  India: ['india'],
}

/** Regions a posting may name instead of a country — a candidate in the country still qualifies. */
export const REGION_ALIASES: Record<string, string[]> = {
  Europe: ['europe', 'eu', 'european timezones', 'european union'],
  EMEA: ['emea'],
  Americas: ['americas', 'north america'],
  LATAM: ['latam', 'latin america', 'south america'],
  APAC: ['apac', 'asia', 'asia pacific', 'asia-pacific'],
}

/** City → country, for the cities the feeds actually publish. */
export const CITY_COUNTRY: Record<string, string> = {
  london: 'UK', londres: 'UK', 'greater london': 'UK', manchester: 'UK', bristol: 'UK',
  edinburgh: 'UK', cambridge: 'UK', leeds: 'UK', birmingham: 'UK', glasgow: 'UK', watford: 'UK',
  lincoln: 'UK', 'milton keynes': 'UK', oxford: 'UK', bath: 'UK', sheffield: 'UK', liverpool: 'UK',
  newcastle: 'UK', nottingham: 'UK', leicester: 'UK', cardiff: 'UK', belfast: 'UK', brighton: 'UK',
  reading: 'UK', southampton: 'UK', aberdeen: 'UK',
  paris: 'France', lyon: 'France', bordeaux: 'France', 'la défense': 'France', toulouse: 'France',
  nantes: 'France', lille: 'France', marseille: 'France',
  berlin: 'Germany', münchen: 'Germany', munich: 'Germany', hamburg: 'Germany', köln: 'Germany',
  cologne: 'Germany', frankfurt: 'Germany', 'frankfurt am main': 'Germany', stuttgart: 'Germany',
  karlsruhe: 'Germany', aachen: 'Germany', düsseldorf: 'Germany', leipzig: 'Germany',
  madrid: 'Spain', barcelona: 'Spain', amsterdam: 'Netherlands', zurich: 'Switzerland',
  zürich: 'Switzerland', geneva: 'Switzerland', dublin: 'Ireland', milan: 'Italy', rome: 'Italy',
  warsaw: 'Poland', lisbon: 'Portugal', stockholm: 'Sweden', vienna: 'Austria', prague: 'Czechia',
  budapest: 'Hungary', 'tel aviv': 'Israel', dubai: 'UAE',
  'new york': 'USA', nyc: 'USA', 'san francisco': 'USA', sf: 'USA', 'los angeles': 'USA',
  chicago: 'USA', boston: 'USA', seattle: 'USA', austin: 'USA', denver: 'USA', atlanta: 'USA',
  dallas: 'USA', houston: 'USA', miami: 'USA', washington: 'USA', 'washington dc': 'USA', dc: 'USA',
  philadelphia: 'USA', phoenix: 'USA', 'san diego': 'USA', minneapolis: 'USA', portland: 'USA',
  charlotte: 'USA', nashville: 'USA', detroit: 'USA', 'salt lake city': 'USA', pittsburgh: 'USA',
  raleigh: 'USA', 'san jose': 'USA', columbus: 'USA', indianapolis: 'USA', 'kansas city': 'USA',
  'st. louis': 'USA', 'st louis': 'USA', tampa: 'USA', orlando: 'USA', 'las vegas': 'USA',
  baltimore: 'USA', sacramento: 'USA', cincinnati: 'USA', cleveland: 'USA', milwaukee: 'USA',
  'san antonio': 'USA', toronto: 'Canada', vancouver: 'Canada', ottawa: 'Canada', calgary: 'Canada',
  montreal: 'Canada', 'mexico city': 'Mexico', 'são paulo': 'Brazil', 'sao paulo': 'Brazil',
  'buenos aires': 'Argentina', sydney: 'Australia', melbourne: 'Australia', tokyo: 'Japan',
  bangalore: 'India', bengaluru: 'India', mumbai: 'India', wien: 'Austria', praha: 'Czechia',
  lisboa: 'Portugal', milano: 'Italy', roma: 'Italy', 'genève': 'Switzerland',
}

export const norm = (s: string) => s.trim().toLowerCase()

export const cityCountry = (p: string): string | null =>
  Object.hasOwn(CITY_COUNTRY, p) ? CITY_COUNTRY[p] : null

export const countryOf = (place: string): string | null => {
  const p = norm(place)
  const viaCity = cityCountry(p)
  if (viaCity) return viaCity
  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (country.toLowerCase() === p || aliases.includes(p)) return country
  }
  return null
}

/**
 * Whether the filter names a place whose country / region the tiers know, so
 * "wider" rows can exist for it. Unknown places ("Atlantis", a small town)
 * only ever match postings that spell them out.
 */
export function isKnownPlace(place: string): boolean {
  const p = norm(place)
  if (!p) return false
  if (countryOf(p)) return true
  return Object.values(REGION_ALIASES).some((aliases) => aliases.includes(p))
}


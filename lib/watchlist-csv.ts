export interface ImportedWatchlistRow {
  symbol: string
  name?: string
  sector?: string
  country?: string
  city?: string
  latitude?: number
  longitude?: number
  shares?: number
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function parseRow(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      const next = line[index + 1]
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseWatchlistCsv(csvText: string): ImportedWatchlistRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    return []
  }

  const delimiter = lines[0].includes('\t') ? '\t' : ','
  const rawHeaders = parseRow(lines[0], delimiter)
  const headers = rawHeaders.map(normalizeHeader)

  const symbolIndex = headers.findIndex((header) => ['symbol', 'ticker'].includes(header))
  if (symbolIndex < 0) {
    throw new Error('CSV must include a symbol or ticker column.')
  }

  const nameIndex = headers.findIndex((header) => ['name', 'company', 'companyname'].includes(header))
  const sectorIndex = headers.findIndex((header) =>
    ['sector', 'industry', 'business', 'endbusiness', 'lineofbusiness'].includes(header),
  )
  const countryIndex = headers.findIndex((header) => ['country', 'nation'].includes(header))
  const cityIndex = headers.findIndex((header) => ['city', 'hqcity', 'headquartercity'].includes(header))
  const latIndex = headers.findIndex((header) => ['lat', 'latitude'].includes(header))
  const lonIndex = headers.findIndex((header) => ['lon', 'lng', 'longitude'].includes(header))
  const sharesIndex = headers.findIndex((header) => ['shares', 'quantity', 'qty'].includes(header))

  const records: ImportedWatchlistRow[] = []

  for (const line of lines.slice(1)) {
    const cells = parseRow(line, delimiter)
    const symbol = cells[symbolIndex]?.toUpperCase().trim()

    if (!symbol) {
      continue
    }

    const record: ImportedWatchlistRow = {
      symbol,
      name: nameIndex >= 0 ? cells[nameIndex] : undefined,
      sector: sectorIndex >= 0 ? cells[sectorIndex] : undefined,
      country: countryIndex >= 0 ? cells[countryIndex] : undefined,
      city: cityIndex >= 0 ? cells[cityIndex] : undefined,
      latitude: latIndex >= 0 ? toNumber(cells[latIndex]) : undefined,
      longitude: lonIndex >= 0 ? toNumber(cells[lonIndex]) : undefined,
      shares: sharesIndex >= 0 ? toNumber(cells[sharesIndex]) : undefined,
    }

    records.push(record)
  }

  return records
}

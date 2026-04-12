export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: string
  marketCap: string
  sector: string
  exchange: string
  currency: string
  shares: number
  totalValue: number
  allTimeReturn: number
  allTimeReturnPercent: number
  dayHigh: number
  dayLow: number
  weekHigh52: number
  weekLow52: number
  pe: number
  eps: number
  dividendYield: number
  priceHistory: { date: string; price: number }[]
  globalImpact: GlobalImpact
  location: StockLocation
}

export interface StockLocation {
  country: string
  city: string
  coordinates: [number, number] // [longitude, latitude]
}

export interface GlobalImpact {
  sentiment: 'bullish' | 'bearish' | 'neutral'
  newsCount: number
  socialScore: number
  analystRating: string
  priceTarget: number
  economicFactors: EconomicFactor[]
  relatedMarkets: RelatedMarket[]
}

export interface EconomicFactor {
  name: string
  impact: 'positive' | 'negative' | 'neutral'
  description: string
}

export interface RelatedMarket {
  name: string
  correlation: number
  change: number
}

export interface MarketIndex {
  name: string
  value: number
  change: number
  changePercent: number
}

// Stock database with location info
export const stockDatabase: Record<string, { name: string; sector: string; location: StockLocation; exchange: string }> = {
  // US Tech
  'AAPL': { name: 'Apple Inc.', sector: 'Technology', location: { country: 'USA', city: 'Cupertino', coordinates: [-122.0322, 37.3230] }, exchange: 'NASDAQ' },
  'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology', location: { country: 'USA', city: 'Mountain View', coordinates: [-122.0841, 37.4220] }, exchange: 'NASDAQ' },
  'MSFT': { name: 'Microsoft Corporation', sector: 'Technology', location: { country: 'USA', city: 'Redmond', coordinates: [-122.1215, 47.6740] }, exchange: 'NASDAQ' },
  'AMZN': { name: 'Amazon.com Inc.', sector: 'Consumer', location: { country: 'USA', city: 'Seattle', coordinates: [-122.3321, 47.6062] }, exchange: 'NASDAQ' },
  'AMD': { name: 'Advanced Micro Devices Inc.', sector: 'Technology', location: { country: 'USA', city: 'Santa Clara', coordinates: [-121.9552, 37.3541] }, exchange: 'NASDAQ' },
  'INTC': { name: 'Intel Corporation', sector: 'Technology', location: { country: 'USA', city: 'Santa Clara', coordinates: [-121.9617, 37.3876] }, exchange: 'NASDAQ' },
  'NVDA': { name: 'NVIDIA Corporation', sector: 'Technology', location: { country: 'USA', city: 'Santa Clara', coordinates: [-121.9758, 37.3707] }, exchange: 'NASDAQ' },
  'ASML': { name: 'ASML Holding N.V.', sector: 'Technology', location: { country: 'Netherlands', city: 'Veldhoven', coordinates: [5.4040, 51.4231] }, exchange: 'NASDAQ' },
  'ACN': { name: 'Accenture plc (Class A)', sector: 'Technology', location: { country: 'Ireland', city: 'Dublin', coordinates: [-6.2603, 53.3498] }, exchange: 'NYSE' },
  
  // Canadian Mining & Resources
  'AAG': { name: 'Aftermath Silver Ltd', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'ATH': { name: 'Athabasca Oil Corp', sector: 'Energy', location: { country: 'Canada', city: 'Calgary', coordinates: [-114.0719, 51.0447] }, exchange: 'TSX' },
  'ATY': { name: 'Atico Mining Corp', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'BNK': { name: 'Big Banc Split Corp Cl A', sector: 'Finance', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'BSX': { name: 'Belo Sun Mining Corp', sector: 'Mining', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'CG': { name: 'Centerra Gold Inc.', sector: 'Mining', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'ENB': { name: 'Enbridge Inc', sector: 'Energy', location: { country: 'Canada', city: 'Calgary', coordinates: [-114.0719, 51.0447] }, exchange: 'TSX' },
  'FUU': { name: 'F3 Uranium Corp', sector: 'Mining', location: { country: 'Canada', city: 'Kelowna', coordinates: [-119.4960, 49.8880] }, exchange: 'TSX' },
  'GCN': { name: 'Goldcliff Resource Corp.', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'GCU': { name: 'Gunnison Copper Corp', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'H': { name: 'Hydro One Limited', sector: 'Utilities', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'AC': { name: 'Air Canada Inc.', sector: 'Airlines', location: { country: 'Canada', city: 'Montreal', coordinates: [-73.5673, 45.5017] }, exchange: 'TSX' },
  'AIM': { name: 'Aimia Inc', sector: 'Finance', location: { country: 'Canada', city: 'Montreal', coordinates: [-73.5673, 45.5017] }, exchange: 'TSX' },
  'ALA': { name: 'AltaGas Ltd', sector: 'Energy', location: { country: 'Canada', city: 'Calgary', coordinates: [-114.0719, 51.0447] }, exchange: 'TSX' },
  'ALC': { name: 'Algoma Central Corp.', sector: 'Shipping', location: { country: 'Canada', city: 'St. Catharines', coordinates: [-79.2468, 43.1594] }, exchange: 'TSX' },
  'AP.UN': { name: 'Allied Properties REIT', sector: 'Real Estate', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'AQN': { name: 'Algonquin Power & Utilities Corp', sector: 'Utilities', location: { country: 'Canada', city: 'Oakville', coordinates: [-79.6877, 43.4675] }, exchange: 'TSX' },
  'ABRA': { name: 'Abrasilver Resource Corp', sector: 'Mining', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'BB': { name: 'BlackBerry Limited', sector: 'Technology', location: { country: 'Canada', city: 'Waterloo', coordinates: [-80.5204, 43.4643] }, exchange: 'TSX' },
  'CHR': { name: 'Chorus Aviation Inc.', sector: 'Airlines', location: { country: 'Canada', city: 'Halifax', coordinates: [-63.5752, 44.6488] }, exchange: 'TSX' },
  'CJ': { name: 'Cardinal Energy Ltd', sector: 'Energy', location: { country: 'Canada', city: 'Calgary', coordinates: [-114.0719, 51.0447] }, exchange: 'TSX' },
  'COCO': { name: 'Coast Copper Corp', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'CPH': { name: 'Cipher Pharmaceuticals Inc', sector: 'Healthcare', location: { country: 'Canada', city: 'Mississauga', coordinates: [-79.6441, 43.5890] }, exchange: 'TSX' },
  'CRCL': { name: 'Corcel Exploration Inc.', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'CUU': { name: 'Copper Fox Metals', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'CVU': { name: 'CPI Aerostructures Inc.', sector: 'Industrial', location: { country: 'USA', city: 'Edgewood', coordinates: [-73.0479, 40.7584] }, exchange: 'NYSE' },
  'DB': { name: 'Decibel Cannabis Company Inc', sector: 'Cannabis', location: { country: 'Canada', city: 'Calgary', coordinates: [-114.0719, 51.0447] }, exchange: 'TSX' },
  'DE': { name: 'Decisive Dividend Corp', sector: 'Finance', location: { country: 'Canada', city: 'Kelowna', coordinates: [-119.4960, 49.8880] }, exchange: 'TSX' },
  'DEF': { name: 'Defiance Silver Corp', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'DIV': { name: 'Diversified Royalty Corporation', sector: 'Finance', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'DML': { name: 'Denison Mines Corp', sector: 'Mining', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'DRT': { name: 'DIRTT Environmental Solutions Limited', sector: 'Industrial', location: { country: 'Canada', city: 'Calgary', coordinates: [-114.0719, 51.0447] }, exchange: 'TSX' },
  'DSV': { name: 'Discovery Silver Corp', sector: 'Mining', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'DYA': { name: 'DynaCERT Inc', sector: 'Technology', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'EDR': { name: 'Endeavour Silver Corp.', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'EIF': { name: 'Exchange Income Corporation', sector: 'Industrial', location: { country: 'Canada', city: 'Winnipeg', coordinates: [-97.1384, 49.8951] }, exchange: 'TSX' },
  'ELF': { name: 'E-L Financial Corporation Ltd.', sector: 'Finance', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'ESK': { name: 'Eskay Mining Corp', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'FDI': { name: 'FinDev Inc', sector: 'Finance', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'FFU': { name: 'F4 Uranium Corp', sector: 'Mining', location: { country: 'Canada', city: 'Kelowna', coordinates: [-119.4960, 49.8880] }, exchange: 'TSX' },
  'FIE': { name: 'iShares Canadian Financial Mthly Inc. Fund', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'FKM': { name: 'Fokus Mining Corporation', sector: 'Mining', location: { country: 'Canada', city: 'Montreal', coordinates: [-73.5673, 45.5017] }, exchange: 'TSX' },
  'FO': { name: 'Falcon Oil & Gas Limited', sector: 'Energy', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'FOOD': { name: 'Goodfood Market Corp', sector: 'Consumer', location: { country: 'Canada', city: 'Montreal', coordinates: [-73.5673, 45.5017] }, exchange: 'TSX' },
  'FTS': { name: 'Fortis Inc.', sector: 'Utilities', location: { country: 'Canada', city: 'St. Johns', coordinates: [-52.7126, 47.5615] }, exchange: 'TSX' },
  'FYL': { name: 'Finlay Minerals', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'GEN': { name: 'Generation Uranium Inc.', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'GENM': { name: 'Generation Mining Ltd', sector: 'Mining', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'GLD': { name: 'Gold Finder Resources Limited', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'GLO': { name: 'Global Atomic Corp.', sector: 'Mining', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'GOLD': { name: 'GoldMining Inc', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'GORO': { name: 'Gold Resource Corporation', sector: 'Mining', location: { country: 'USA', city: 'Denver', coordinates: [-104.9903, 39.7392] }, exchange: 'NYSE' },
  'GR': { name: 'Great Atlantic Resources Corp', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'GRA': { name: 'Nanoxplore Inc.', sector: 'Technology', location: { country: 'Canada', city: 'Montreal', coordinates: [-73.5673, 45.5017] }, exchange: 'TSX' },
  'GSPR': { name: 'GSP Resource Corp', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'GVR': { name: 'Grosvenor Resource Corp', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'HLU': { name: 'Homeland Uranium Corp.', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'IAI': { name: 'Infinitii AI Inc', sector: 'Technology', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'INX': { name: 'Intouch Insight Ltd', sector: 'Technology', location: { country: 'Canada', city: 'Ottawa', coordinates: [-75.6972, 45.4215] }, exchange: 'TSX' },
  'JET': { name: 'Global Crossing Airlines Group Inc', sector: 'Airlines', location: { country: 'USA', city: 'Miami', coordinates: [-80.1918, 25.7617] }, exchange: 'NYSE' },
  
  // US ETFs
  'BITK': { name: 'ETF Opportunities Trust - Tuttle Capital Ibit 0Dte Covered Call ETF', sector: 'ETF', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'BITO': { name: 'ProShares Bitcoin Strategy ETF', sector: 'ETF', location: { country: 'USA', city: 'Bethesda', coordinates: [-77.0947, 38.9807] }, exchange: 'NYSE' },
  'BLOX': { name: 'Tidal Trust II - Nicholas Crypto Income ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'CHAT': { name: 'Tidal Trust II - Roundhill Generative A.I. & Technology ETF', sector: 'ETF', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'DIPS': { name: 'Tidal Trust II - Yieldmax Short Nvda Option Income Strategy ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'ABNY': { name: 'Tidal Trust II - Yieldmax Abnb Option Income Strategy ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'ALIT': { name: 'Alight Inc. (Class A)', sector: 'Technology', location: { country: 'USA', city: 'Lincolnshire', coordinates: [-87.9006, 42.1989] }, exchange: 'NYSE' },
  'ALOY': { name: 'REalloys Inc.', sector: 'Technology', location: { country: 'USA', city: 'San Jose', coordinates: [-121.8863, 37.3382] }, exchange: 'NASDAQ' },
  'ALTS': { name: 'ALT5 Sigma Corporation', sector: 'Finance', location: { country: 'USA', city: 'Miami', coordinates: [-80.1918, 25.7617] }, exchange: 'NASDAQ' },
  'AMDD': { name: 'Direxion Shares ETF Trust - Daily Amd Bear 1X Shares', sector: 'ETF', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'AMDW': { name: 'Roundhill ETF Trust - Amd Weeklypay ETF', sector: 'ETF', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'AMDY': { name: 'Tidal Trust II - Yieldmax Amd Option Income Strategy ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'AMZY': { name: 'Tidal ETF II - Yieldmax Amzn Option Income Strategy ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'ASMG': { name: 'Themes ETF Trust - Leverage Shares 2X Long Asml Daily ETF', sector: 'ETF', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'ASST': { name: 'Strive Inc.', sector: 'Finance', location: { country: 'USA', city: 'Columbus', coordinates: [-82.9988, 39.9612] }, exchange: 'NYSE' },
  'BEEX': { name: 'Tidal Trust III - Beehive ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'CONY': { name: 'Tidal Trust II - Yieldmax Coin Option Income Strategy ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'CRCO': { name: 'Tidal Trust II - Yieldmax Crcl Option Income Strategy ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'EGGQ': { name: 'Tidal Trust III - Nest Yield Visionary ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'EGGY': { name: 'NestYield Dynamic Income ETF', sector: 'ETF', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'EHLS': { name: 'Tidal Trust II - Even Herd Long Short ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'FBY': { name: 'Tidal Trust II - Yieldmax Meta Option Income Strategy ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'FCUS': { name: 'Tidal ETF II - Pinnacle Focused Opportunities ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'FDAT': { name: 'Tidal Trust II - Tactical Advantage ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'HIYY': { name: 'Tidal Trust II - Yieldmax Hims Option Income Strategy ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'AIYY': { name: 'Tidal Trust II - Yieldmax A.I. Option Income Strategy ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  
  // Canadian ETFs
  'AAPY': { name: 'Kurv ETF Trust - Kurv Yield Premium Strategy Apple ETF', sector: 'ETF', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'AUME': { name: 'Auriginal Mining Corp.', sector: 'Mining', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'BOAT': { name: 'SonicShares Global Shipping ETF', sector: 'ETF', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'BOIL': { name: 'Beyond Oil Limited', sector: 'Energy', location: { country: 'Israel', city: 'Yokneam', coordinates: [35.1082, 32.6593] }, exchange: 'TSX' },
  'BOXL': { name: 'Boxlight Corporation', sector: 'Technology', location: { country: 'USA', city: 'Atlanta', coordinates: [-84.3880, 33.7490] }, exchange: 'NASDAQ' },
  'BRCC': { name: 'BRC Inc.', sector: 'Consumer', location: { country: 'USA', city: 'Salt Lake City', coordinates: [-111.8910, 40.7608] }, exchange: 'NYSE' },
  'BRLT': { name: 'Brilliant Earth Group Inc - Class A', sector: 'Consumer', location: { country: 'USA', city: 'San Francisco', coordinates: [-122.4194, 37.7749] }, exchange: 'NASDAQ' },
  'BTB.UN': { name: 'BTB Real Estate Investment Trust - Unit', sector: 'Real Estate', location: { country: 'Canada', city: 'Montreal', coordinates: [-73.5673, 45.5017] }, exchange: 'TSX' },
  'BTCY': { name: 'Purpose Bitcoin Yield ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'BTO': { name: 'B2Gold Corp.', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'BTT': { name: 'Bitteroot Resource Limited', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'BURU': { name: 'Nuburu Inc.', sector: 'Technology', location: { country: 'USA', city: 'Centennial', coordinates: [-104.8766, 39.5916] }, exchange: 'NYSE' },
  'BWET': { name: 'Amplify Commodity Trust - Breakwave Tanker Shipping ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'CAD': { name: 'Colonial Coal International Corp', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'CASH': { name: 'Global X High Interest Savings ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'CBI': { name: 'Colibri Resource Corporation', sector: 'Mining', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'CFY': { name: 'CF Energy Corp', sector: 'Energy', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'CHGG': { name: 'Chegg Inc', sector: 'Education', location: { country: 'USA', city: 'Santa Clara', coordinates: [-121.9552, 37.3541] }, exchange: 'NYSE' },
  'CLIR': { name: 'Clearsign Technologies Corporation', sector: 'Technology', location: { country: 'USA', city: 'Tulsa', coordinates: [-95.9928, 36.1540] }, exchange: 'NASDAQ' },
  'CLS': { name: 'Celestica Inc.', sector: 'Technology', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'CRNC': { name: 'Cerence Inc.', sector: 'Technology', location: { country: 'USA', city: 'Burlington', coordinates: [-71.1956, 42.5048] }, exchange: 'NASDAQ' },
  'CSCMY': { name: 'COSCO Shipping International Singapore Co Ltd', sector: 'Shipping', location: { country: 'Singapore', city: 'Singapore', coordinates: [103.8198, 1.3521] }, exchange: 'OTC' },
  'CTF.UN': { name: 'Citadel Income Fund', sector: 'Finance', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'CTGO': { name: 'Contango Silver And Gold Inc.', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'CURX': { name: 'Curanex Pharmaceuticals Inc.', sector: 'Healthcare', location: { country: 'USA', city: 'Cambridge', coordinates: [-71.1097, 42.3736] }, exchange: 'NASDAQ' },
  'DOMO': { name: 'Domo Inc. (Class B)', sector: 'Technology', location: { country: 'USA', city: 'American Fork', coordinates: [-111.7957, 40.3769] }, exchange: 'NASDAQ' },
  'DSX': { name: 'Diana Shipping Inc', sector: 'Shipping', location: { country: 'Greece', city: 'Athens', coordinates: [23.7275, 37.9838] }, exchange: 'NYSE' },
  'DVLT': { name: 'Datavault Inc.', sector: 'Technology', location: { country: 'USA', city: 'San Juan', coordinates: [-66.1057, 18.4655] }, exchange: 'OTC' },
  
  // Global Companies
  'ABEV': { name: 'Ambev S.A.', sector: 'Consumer', location: { country: 'Brazil', city: 'Sao Paulo', coordinates: [-46.6333, -23.5505] }, exchange: 'NYSE' },
  'ACHR': { name: 'Archer Aviation Inc.', sector: 'Aerospace', location: { country: 'USA', city: 'San Jose', coordinates: [-121.8863, 37.3382] }, exchange: 'NYSE' },
  'AGNC': { name: 'AGNC Investment Corp', sector: 'Finance', location: { country: 'USA', city: 'Bethesda', coordinates: [-77.0947, 38.9807] }, exchange: 'NASDAQ' },
  'AI': { name: 'Atrium Mortgage Investment Corporation', sector: 'Finance', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'AIIO': { name: 'Robo.AI Inc.', sector: 'Technology', location: { country: 'USA', city: 'Austin', coordinates: [-97.7431, 30.2672] }, exchange: 'NASDAQ' },
  'AIRI': { name: 'Air Industries Group', sector: 'Aerospace', location: { country: 'USA', city: 'Bay Shore', coordinates: [-73.2454, 40.7248] }, exchange: 'NYSE' },
  'ASC': { name: 'Ardmore Shipping Corp', sector: 'Shipping', location: { country: 'Ireland', city: 'Cork', coordinates: [-8.4863, 51.8985] }, exchange: 'NYSE' },
  'ATD': { name: 'Alimentation Couche-Tard, Inc.', sector: 'Consumer', location: { country: 'Canada', city: 'Laval', coordinates: [-73.7515, 45.5577] }, exchange: 'TSX' },
  'AVGO': { name: 'Broadcom Inc.', sector: 'Technology', location: { country: 'USA', city: 'San Jose', coordinates: [-121.8863, 37.3382] }, exchange: 'NASDAQ' },
  'BA': { name: 'Boeing Co.', sector: 'Aerospace', location: { country: 'USA', city: 'Arlington', coordinates: [-77.0910, 38.8816] }, exchange: 'NYSE' },
  'BAD': { name: 'Naughty Ventures Corp.', sector: 'Consumer', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'CSE' },
  'BAX': { name: 'Baxter International Inc.', sector: 'Healthcare', location: { country: 'USA', city: 'Deerfield', coordinates: [-87.8445, 42.1711] }, exchange: 'NYSE' },
  'BBAI': { name: 'BigBear.ai Holdings Inc', sector: 'Technology', location: { country: 'USA', city: 'Columbia', coordinates: [-76.6122, 39.0458] }, exchange: 'NYSE' },
  'BBD': { name: 'Banco Bradesco S.A.', sector: 'Finance', location: { country: 'Brazil', city: 'Osasco', coordinates: [-46.7916, -23.5328] }, exchange: 'NYSE' },
  'BDRY': { name: 'Amplify Commodity Trust - Breakwave Dry Bulk Shipping ETF', sector: 'ETF', location: { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781] }, exchange: 'NYSE' },
  'BEA': { name: 'Belmont Resources Inc.', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'BFRG': { name: 'Bullfrog AI Holdings Inc', sector: 'Technology', location: { country: 'USA', city: 'Baltimore', coordinates: [-76.6122, 39.2904] }, exchange: 'NASDAQ' },
  'BGS': { name: 'B&G Foods, Inc', sector: 'Consumer', location: { country: 'USA', city: 'Parsippany', coordinates: [-74.4257, 40.8579] }, exchange: 'NYSE' },
  'BHC': { name: 'Bausch Health Companies Inc.', sector: 'Healthcare', location: { country: 'Canada', city: 'Laval', coordinates: [-73.7515, 45.5577] }, exchange: 'TSX' },
  'BP': { name: 'BP Plc', sector: 'Energy', location: { country: 'UK', city: 'London', coordinates: [-0.1276, 51.5074] }, exchange: 'NYSE' },
  'EL': { name: 'The Estee Lauder Companies Inc.', sector: 'Consumer', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'ENCC': { name: 'Global X Canadian Oil and Gas Equity Covered Call ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'EOSE': { name: 'Eos Energy Enterprises Inc (Class A)', sector: 'Energy', location: { country: 'USA', city: 'Edison', coordinates: [-74.4121, 40.5187] }, exchange: 'NASDAQ' },
  'ETF': { name: 'Eastfield Resources Ltd.', sector: 'Mining', location: { country: 'Canada', city: 'Vancouver', coordinates: [-123.1207, 49.2827] }, exchange: 'TSX' },
  'ETHY': { name: 'Purpose Ether Yield ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'EVTV': { name: 'Envirotech Vehicles Inc.', sector: 'Automotive', location: { country: 'USA', city: 'Osceola', coordinates: [-89.8676, 34.7604] }, exchange: 'NASDAQ' },
  'FBAL': { name: 'All-in-One Balanced ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'FHN': { name: 'First Horizon Corporation', sector: 'Finance', location: { country: 'USA', city: 'Memphis', coordinates: [-90.0490, 35.1495] }, exchange: 'NYSE' },
  'FIGS': { name: 'Figs Inc (Class A)', sector: 'Consumer', location: { country: 'USA', city: 'Santa Monica', coordinates: [-118.4912, 34.0195] }, exchange: 'NYSE' },
  'GDX': { name: 'VanEck ETF Trust - Vaneck Gold Miners ETF', sector: 'ETF', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'GNK': { name: 'Genco Shipping & Trading Limited', sector: 'Shipping', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NYSE' },
  'GOGY': { name: 'Harvest Alphabet Enhanced High Income Shares ETF - Class A', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'GPRO': { name: 'GoPro Inc. (Class A)', sector: 'Technology', location: { country: 'USA', city: 'San Mateo', coordinates: [-122.3255, 37.5630] }, exchange: 'NASDAQ' },
  'GRAB': { name: 'Grab Holdings Limited (Class A)', sector: 'Technology', location: { country: 'Singapore', city: 'Singapore', coordinates: [103.8198, 1.3521] }, exchange: 'NASDAQ' },
  'GSL': { name: 'Global Ship Lease Inc (Class A)', sector: 'Shipping', location: { country: 'UK', city: 'London', coordinates: [-0.1276, 51.5074] }, exchange: 'NYSE' },
  'HBIX': { name: 'Harvest Bitcoin Enhanced Income ETF - Class A', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HDB': { name: 'HDFC Bank Limited', sector: 'Finance', location: { country: 'India', city: 'Mumbai', coordinates: [72.8777, 19.0760] }, exchange: 'NYSE' },
  'HGGG': { name: 'Harvest Global Gold Giants Index ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HGR': { name: 'Harvest Global REIT Leaders Income ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HGY': { name: 'Global X Gold Yield ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HHL': { name: 'Harvest Healthcare Leaders Income ETF - Class A', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HHL.B': { name: 'Harvest Healthcare Leaders Income ETF Unhedged', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HHL.U': { name: 'Harvest Portfolios Group Inc (Class U)', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HHLE': { name: 'Harvest Healthcare Leaders Enhanced Income ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HPYT': { name: 'Harvest Premium Yield Treasury ETF - Class A', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HPYT.B': { name: 'Harvest Premium Yield Treasury ETF - Class B Unhedged', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HPYT.U': { name: 'Harvest Premium Yield Treasury ETF - Class U', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HSHP': { name: 'Himalaya Shipping Limited', sector: 'Shipping', location: { country: 'Bermuda', city: 'Hamilton', coordinates: [-64.7833, 32.2949] }, exchange: 'NYSE' },
  'HTAE': { name: 'Harvest Tech Achievers Enhanced Income ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HUG': { name: 'Global X Gold ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HUTL': { name: 'Harvest Equal Weight Global Utilities Income ETF', sector: 'ETF', location: { country: 'Canada', city: 'Toronto', coordinates: [-79.3832, 43.6532] }, exchange: 'TSX' },
  'HY': { name: 'Hyster-Yale Inc.', sector: 'Industrial', location: { country: 'USA', city: 'Cleveland', coordinates: [-81.6944, 41.4993] }, exchange: 'NYSE' },
  'HYGH': { name: 'iShares U.S. ETF Trust - It Rights Hedged Hgyl', sector: 'ETF', location: { country: 'USA', city: 'San Francisco', coordinates: [-122.4194, 37.7749] }, exchange: 'NYSE' },
  'IEP': { name: 'Icahn Enterprises LP', sector: 'Finance', location: { country: 'USA', city: 'Sunny Isles Beach', coordinates: [-80.1226, 25.9387] }, exchange: 'NASDAQ' },
  'IGE': { name: 'iShares Trust - North Amern Nat', sector: 'ETF', location: { country: 'USA', city: 'San Francisco', coordinates: [-122.4194, 37.7749] }, exchange: 'NYSE' },
  'IMUX': { name: 'Immunic Inc', sector: 'Healthcare', location: { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }, exchange: 'NASDAQ' },
  'JET.B': { name: 'Global Crossing Airlines Group Inc.', sector: 'Airlines', location: { country: 'USA', city: 'Miami', coordinates: [-80.1918, 25.7617] }, exchange: 'TSX' },
  'ALGO': { name: 'Light A.I. Inc.', sector: 'Technology', location: { country: 'USA', city: 'Palo Alto', coordinates: [-122.1430, 37.4419] }, exchange: 'NASDAQ' },
}

// Sample stock data generator with location
export function generateStockData(symbol: string, name: string): Stock {
  const stockInfo = stockDatabase[symbol]
  const basePrice = Math.random() * 300 + 5
  const change = (Math.random() - 0.5) * 20
  const changePercent = (change / basePrice) * 100
  const shares = Math.random() * 100 + 0.1
  const totalValue = basePrice * shares
  const allTimeReturn = (Math.random() - 0.4) * totalValue
  const allTimeReturnPercent = (allTimeReturn / (totalValue - allTimeReturn)) * 100

  // Generate price history for the last 30 days
  const priceHistory = []
  let currentPrice = basePrice - change * 30
  for (let i = 30; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    currentPrice += (Math.random() - 0.48) * 5
    priceHistory.push({
      date: date.toISOString().split('T')[0],
      price: Math.max(currentPrice, 1),
    })
  }

  const ratings = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']
  const defaultLocation: StockLocation = { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] }

  return {
    symbol,
    name: stockInfo?.name || name,
    price: basePrice,
    change,
    changePercent,
    volume: `${(Math.random() * 50 + 0.1).toFixed(2)}M`,
    marketCap: `${(Math.random() * 500 + 0.5).toFixed(2)}B`,
    sector: stockInfo?.sector || 'Other',
    exchange: stockInfo?.exchange || 'NYSE',
    currency: symbol.includes('.') || ['TSX', 'CSE'].includes(stockInfo?.exchange || '') ? 'CAD' : 'USD',
    shares: parseFloat(shares.toFixed(4)),
    totalValue,
    allTimeReturn,
    allTimeReturnPercent,
    dayHigh: basePrice + Math.random() * 5,
    dayLow: basePrice - Math.random() * 5,
    weekHigh52: basePrice * 1.4,
    weekLow52: basePrice * 0.6,
    pe: Math.random() * 40 + 5,
    eps: Math.random() * 10 + 0.5,
    dividendYield: Math.random() * 5,
    priceHistory,
    location: stockInfo?.location || defaultLocation,
    globalImpact: {
      sentiment: change > 0 ? 'bullish' : change < -5 ? 'bearish' : 'neutral',
      newsCount: Math.floor(Math.random() * 50 + 5),
      socialScore: Math.floor(Math.random() * 100),
      analystRating: ratings[Math.floor(Math.random() * ratings.length)],
      priceTarget: basePrice * (1 + (Math.random() - 0.3) * 0.4),
      economicFactors: [
        {
          name: 'Interest Rates',
          impact: Math.random() > 0.5 ? 'positive' : 'negative',
          description: 'Federal Reserve policy impact on valuation',
        },
        {
          name: 'Currency Exchange',
          impact: Math.random() > 0.6 ? 'positive' : 'neutral',
          description: 'USD/CAD strength affecting international revenue',
        },
        {
          name: 'Supply Chain',
          impact: Math.random() > 0.4 ? 'neutral' : 'negative',
          description: 'Global logistics and procurement efficiency',
        },
      ],
      relatedMarkets: [
        { name: 'S&P 500', correlation: 0.7 + Math.random() * 0.25, change: (Math.random() - 0.5) * 3 },
        { name: 'TSX', correlation: 0.6 + Math.random() * 0.3, change: (Math.random() - 0.5) * 4 },
        { name: 'Sector ETF', correlation: 0.8 + Math.random() * 0.15, change: (Math.random() - 0.5) * 2 },
      ],
    },
  }
}

// Get all stocks from the database
export const defaultStocks: { symbol: string; name: string }[] = Object.entries(stockDatabase).map(([symbol, info]) => ({
  symbol,
  name: info.name,
}))

export const popularStocks = defaultStocks.slice(0, 50)

export const marketIndices: MarketIndex[] = [
  { name: 'S&P 500', value: 5234.18, change: 23.45, changePercent: 0.45 },
  { name: 'NASDAQ', value: 16428.82, change: -45.23, changePercent: -0.27 },
  { name: 'TSX', value: 22156.34, change: 87.12, changePercent: 0.39 },
  { name: 'DOW', value: 39127.14, change: 156.87, changePercent: 0.40 },
]

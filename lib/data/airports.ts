export interface Airport {
  code: string
  city: string
  name: string
  state: string
}

export const AIRPORTS: Airport[] = [
  // Texas
  { code: 'DAL', city: 'Dallas', name: 'Dallas Love Field', state: 'TX' },
  { code: 'DFW', city: 'Dallas', name: 'Dallas/Fort Worth International', state: 'TX' },
  { code: 'ADS', city: 'Dallas', name: 'Addison Airport', state: 'TX' },
  { code: 'IAH', city: 'Houston', name: 'George Bush Intercontinental', state: 'TX' },
  { code: 'HOU', city: 'Houston', name: 'William P. Hobby Airport', state: 'TX' },
  { code: 'EFD', city: 'Houston', name: 'Ellington Airport', state: 'TX' },
  { code: 'AUS', city: 'Austin', name: 'Austin-Bergstrom International', state: 'TX' },
  { code: 'SAT', city: 'San Antonio', name: 'San Antonio International', state: 'TX' },
  { code: 'LBB', city: 'Lubbock', name: 'Lubbock Preston Smith International', state: 'TX' },
  { code: 'AMA', city: 'Amarillo', name: 'Rick Husband Amarillo International', state: 'TX' },
  { code: 'ELP', city: 'El Paso', name: 'El Paso International', state: 'TX' },
  { code: 'CRP', city: 'Corpus Christi', name: 'Corpus Christi International', state: 'TX' },
  { code: 'MFE', city: 'McAllen', name: 'McAllen Miller International', state: 'TX' },
  { code: 'GRK', city: 'Killeen', name: 'Killeen-Fort Hood Regional', state: 'TX' },
  { code: 'SJT', city: 'San Angelo', name: 'San Angelo Regional', state: 'TX' },
  { code: 'MAF', city: 'Midland', name: 'Midland International', state: 'TX' },
  { code: 'OAK', city: 'Odessa', name: 'Odessa-Schlemeyer Field', state: 'TX' },

  // Major hubs
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy International', state: 'NY' },
  { code: 'LGA', city: 'New York', name: 'LaGuardia Airport', state: 'NY' },
  { code: 'EWR', city: 'Newark', name: 'Newark Liberty International', state: 'NJ' },
  { code: 'TEB', city: 'New York', name: 'Teterboro Airport', state: 'NJ' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International', state: 'CA' },
  { code: 'VNY', city: 'Los Angeles', name: 'Van Nuys Airport', state: 'CA' },
  { code: 'BUR', city: 'Burbank', name: 'Hollywood Burbank Airport', state: 'CA' },
  { code: 'SNA', city: 'Orange County', name: 'John Wayne Airport', state: 'CA' },
  { code: 'SMF', city: 'Sacramento', name: 'Sacramento International', state: 'CA' },
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco International', state: 'CA' },
  { code: 'SJC', city: 'San Jose', name: 'Norman Y. Mineta San José International', state: 'CA' },
  { code: 'SAN', city: 'San Diego', name: 'San Diego International', state: 'CA' },
  { code: 'ORD', city: 'Chicago', name: "O'Hare International", state: 'IL' },
  { code: 'MDW', city: 'Chicago', name: 'Chicago Midway International', state: 'IL' },
  { code: 'PWK', city: 'Chicago', name: 'Chicago Executive Airport', state: 'IL' },
  { code: 'MIA', city: 'Miami', name: 'Miami International', state: 'FL' },
  { code: 'FLL', city: 'Fort Lauderdale', name: 'Fort Lauderdale-Hollywood International', state: 'FL' },
  { code: 'OPF', city: 'Miami', name: 'Miami Opa-locka Executive Airport', state: 'FL' },
  { code: 'MCO', city: 'Orlando', name: 'Orlando International', state: 'FL' },
  { code: 'ORL', city: 'Orlando', name: 'Orlando Executive Airport', state: 'FL' },
  { code: 'TPA', city: 'Tampa', name: 'Tampa International', state: 'FL' },
  { code: 'PBI', city: 'Palm Beach', name: 'Palm Beach International', state: 'FL' },
  { code: 'JAX', city: 'Jacksonville', name: 'Jacksonville International', state: 'FL' },
  { code: 'ATL', city: 'Atlanta', name: 'Hartsfield-Jackson Atlanta International', state: 'GA' },
  { code: 'PDK', city: 'Atlanta', name: 'DeKalb-Peachtree Airport', state: 'GA' },
  { code: 'BOS', city: 'Boston', name: 'Logan International', state: 'MA' },
  { code: 'BED', city: 'Boston', name: 'Laurence G. Hanscom Field', state: 'MA' },
  { code: 'ACK', city: 'Nantucket', name: 'Nantucket Memorial Airport', state: 'MA' },
  { code: 'HPN', city: 'White Plains', name: 'Westchester County Airport', state: 'NY' },
  { code: 'DCA', city: 'Washington DC', name: 'Reagan National Airport', state: 'VA' },
  { code: 'IAD', city: 'Washington DC', name: 'Dulles International', state: 'VA' },
  { code: 'BWI', city: 'Baltimore', name: 'Baltimore/Washington International', state: 'MD' },
  { code: 'SEA', city: 'Seattle', name: 'Seattle-Tacoma International', state: 'WA' },
  { code: 'BFI', city: 'Seattle', name: 'Boeing Field/King County International', state: 'WA' },
  { code: 'DEN', city: 'Denver', name: 'Denver International', state: 'CO' },
  { code: 'APA', city: 'Denver', name: 'Denver South/Centennial Airport', state: 'CO' },
  { code: 'ASE', city: 'Aspen', name: 'Aspen/Pitkin County Airport', state: 'CO' },
  { code: 'LAS', city: 'Las Vegas', name: 'Harry Reid International', state: 'NV' },
  { code: 'HND', city: 'Las Vegas', name: 'Henderson Executive Airport', state: 'NV' },
  { code: 'PHX', city: 'Phoenix', name: 'Phoenix Sky Harbor International', state: 'AZ' },
  { code: 'SDL', city: 'Scottsdale', name: 'Scottsdale Airport', state: 'AZ' },
  { code: 'MSP', city: 'Minneapolis', name: 'Minneapolis-Saint Paul International', state: 'MN' },
  { code: 'DTW', city: 'Detroit', name: 'Detroit Metropolitan Airport', state: 'MI' },
  { code: 'CLT', city: 'Charlotte', name: 'Charlotte Douglas International', state: 'NC' },
  { code: 'RDU', city: 'Raleigh', name: 'Raleigh-Durham International', state: 'NC' },
  { code: 'PHL', city: 'Philadelphia', name: 'Philadelphia International', state: 'PA' },
  { code: 'PNE', city: 'Philadelphia', name: 'Northeast Philadelphia Airport', state: 'PA' },
  { code: 'SLC', city: 'Salt Lake City', name: 'Salt Lake City International', state: 'UT' },
  { code: 'MSY', city: 'New Orleans', name: 'Louis Armstrong International', state: 'LA' },
  { code: 'BNA', city: 'Nashville', name: 'Nashville International', state: 'TN' },
  { code: 'MEM', city: 'Memphis', name: 'Memphis International', state: 'TN' },
  { code: 'STL', city: 'St. Louis', name: 'St. Louis Lambert International', state: 'MO' },
  { code: 'MCI', city: 'Kansas City', name: 'Kansas City International', state: 'MO' },
  { code: 'OKC', city: 'Oklahoma City', name: 'Will Rogers World Airport', state: 'OK' },
  { code: 'TUL', city: 'Tulsa', name: 'Tulsa International', state: 'OK' },
  { code: 'ABQ', city: 'Albuquerque', name: 'Albuquerque International Sunport', state: 'NM' },
  { code: 'MSN', city: 'Madison', name: 'Dane County Regional Airport', state: 'WI' },
  { code: 'CLE', city: 'Cleveland', name: 'Cleveland Hopkins International', state: 'OH' },
  { code: 'CMH', city: 'Columbus', name: 'John Glenn Columbus International', state: 'OH' },
  { code: 'IND', city: 'Indianapolis', name: 'Indianapolis International', state: 'IN' },
  { code: 'SDF', city: 'Louisville', name: 'Louisville Muhammad Ali International', state: 'KY' },
  { code: 'CVG', city: 'Cincinnati', name: 'Cincinnati/Northern Kentucky International', state: 'KY' },
  { code: 'PIT', city: 'Pittsburgh', name: 'Pittsburgh International', state: 'PA' },
  { code: 'RSW', city: 'Fort Myers', name: 'Southwest Florida International', state: 'FL' },
  { code: 'SRQ', city: 'Sarasota', name: 'Sarasota Bradenton International', state: 'FL' },
  { code: 'EYW', city: 'Key West', name: 'Key West International', state: 'FL' },
  { code: 'NAS', city: 'Nassau', name: 'Lynden Pindling International', state: 'BS' },
]

export function searchAirports(query: string): Airport[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return AIRPORTS.filter(a =>
    a.code.toLowerCase().startsWith(q) ||
    a.city.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q) ||
    a.state.toLowerCase().startsWith(q)
  ).slice(0, 6)
}

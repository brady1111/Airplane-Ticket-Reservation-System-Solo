//this file contains a list of airports with their codes, cities, and names.

export interface Airport {
  code: string;
  city: string;
  name: string;
}

export const AIRPORTS: Airport[] = [
  { code: 'LEX', city: 'Lexington', name: 'Blue Grass Airport' },
  { code: 'SDF', city: 'Louisville', name: 'Louisville Muhammad Ali International Airport' },
  { code: 'CVG', city: 'Cincinnati', name: 'Cincinnati/Northern Kentucky International Airport' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International Airport' },
  { code: 'LGA', city: 'New York', name: 'LaGuardia Airport' },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy International Airport' },
  { code: 'ORD', city: 'Chicago', name: "O'Hare International Airport" },
  { code: 'ATL', city: 'Atlanta', name: 'Hartsfield-Jackson Atlanta International Airport' },
  { code: 'MIA', city: 'Miami', name: 'Miami International Airport' },
  { code: 'DFW', city: 'Dallas', name: 'Dallas Fort Worth International Airport' },
  { code: 'DEN', city: 'Denver', name: 'Denver International Airport' },
  { code: 'SEA', city: 'Seattle', name: 'Seattle-Tacoma International Airport' },
  { code: 'LHR', city: 'London', name: 'Heathrow Airport' },
  { code: 'LAS', city: 'Las Vegas', name: 'Harry Reid International Airport' },
  { code: 'BOS', city: 'Boston', name: 'Logan International Airport' }
];
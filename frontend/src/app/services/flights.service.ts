import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

//represents a flight returned by Django
export interface Flight {
  offer_id: string;
  airline: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: string;
  stops: number;
}

//represents the flight search response
export interface FlightSearchResponse {
  flights: Flight[];
}

@Injectable({
  providedIn: 'root'
})
export class FlightService {

  private apiUrl = 'http://localhost:8000/api/flights';

  constructor(private http: HttpClient) {}

  //search for available flights using the Django/Duffel API
  searchFlights(
  departureAirport: string,
  arrivalAirport: string,
  departureDate: string,
  passengers: number = 1
): Observable<FlightSearchResponse> {

  return this.http.post<FlightSearchResponse>(
    `${this.apiUrl}/search/`,
    {
      departure_airport: departureAirport,
      arrival_airport: arrivalAirport,
      departure_date: departureDate,
      passengers: passengers
    }
  ).pipe( //set a timeout of 20 seconds for the flight search request
    timeout(20000)
  );
}
}
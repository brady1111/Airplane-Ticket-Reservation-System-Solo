import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReservationPassenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  seatNumber: string;
}
export interface CreateReservationRequest {
  offer_id: string;
  passengers: ReservationPassenger[];
}
export interface CreateReservationResponse {
  message: string;
  reservation_id: number;
  booking_reference: string;
}
export interface CustomerReservation {
  reservation_id: number;
  booking_reference: string;
  airline_name: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  created_at: string;
  total_price: string;
  status: string;
}
export interface ReservationDetailsPassenger {
  passenger_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  passenger_type: string;
  is_main_passenger: boolean;
  ticket_number: string | null;
  seat_number: string | null;
}
export interface ReservationDetailsResponse {
  reservation: CustomerReservation;
  passengers: ReservationDetailsPassenger[];
}
export interface EditReservationPassenger {
  passenger_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  seat_number: string;
}
export interface EditReservationRequest {
  passengers: EditReservationPassenger[];
}
export interface FlightSeatRequest {
  airline_name: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
}
export interface FlightSeatResponse {
  occupied_seats: string[];
}
export interface ChangeFlightRequest {
  offer_id: string;
  passengers: { passenger_id: number; seat_number: string }[];
}
@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private apiUrl = 'http://localhost:8000/api/reservations/';
  constructor(private http: HttpClient) {}
  createReservation(reservation: CreateReservationRequest): Observable<CreateReservationResponse> {
    return this.http.post<CreateReservationResponse>(`${this.apiUrl}create/`, reservation, { withCredentials: true });
  }
  getCustomerReservations(): Observable<CustomerReservation[]> {
    return this.http.get<CustomerReservation[]>(`${this.apiUrl}customer/`, { withCredentials: true });
  }
  getReservationDetails(reservationId: number): Observable<ReservationDetailsResponse> {
    return this.http.get<ReservationDetailsResponse>(`${this.apiUrl}${reservationId}/details/`, { withCredentials: true });
  }
  cancelReservation(reservationId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}${reservationId}/cancel/`, {}, { withCredentials: true });
  }
  editReservation(reservationId: number, reservation: EditReservationRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}${reservationId}/edit/`, reservation, { withCredentials: true });
  }
  changeFlight(reservationId: number, change: ChangeFlightRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}${reservationId}/change-flight/`, change, { withCredentials: true });
  }
  getOccupiedSeats(flight: FlightSeatRequest): Observable<FlightSeatResponse> {
    return this.http.get<FlightSeatResponse>(`${this.apiUrl}seats/occupied/`, {
      params: {
        airline_name: flight.airline_name,
        flight_number: flight.flight_number,
        departure_airport: flight.departure_airport,
        arrival_airport: flight.arrival_airport,
        departure_time: flight.departure_time
      },
      withCredentials: true
    });
  }
}

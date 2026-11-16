
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//passenger information used when creating a reservation
export interface ReservationPassenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  seatNumber: string;
}

//request to create a reservation
export interface CreateReservationRequest {
  offer_id: string;
  passengers: ReservationPassenger[];
}

//response after creating a reservation
export interface CreateReservationResponse {
  message: string;
  reservation_id: number;
  booking_reference: string;
}

//customer reservation information
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

//passenger and ticket information
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

//response containing reservation and passenger details
export interface ReservationDetailsResponse {
  reservation: CustomerReservation;
  passengers: ReservationDetailsPassenger[];
}

//passenger information used when editing a reservation
export interface EditReservationPassenger {
  passenger_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  seat_number: string;
}

//request to edit a reservation
export interface EditReservationRequest {
  passengers: EditReservationPassenger[];
}

//flight information used to retrieve occupied seats
export interface FlightSeatRequest {
  airline_name: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
}

//response containing occupied seats
export interface FlightSeatResponse {
  occupied_seats: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ReservationsService {

  private apiUrl = 'http://localhost:8000/api/reservations/';

  constructor(private http: HttpClient) {}

  //create a new reservation
  createReservation(
    reservation: CreateReservationRequest
  ): Observable<CreateReservationResponse> {
    return this.http.post<CreateReservationResponse>(
      `${this.apiUrl}create/`,
      reservation,
      { withCredentials: true }
    );
  }

  //retrieve the customer's reservations
  getCustomerReservations(): Observable<CustomerReservation[]> {
    return this.http.get<CustomerReservation[]>(
      `${this.apiUrl}customer/`,
      { withCredentials: true }
    );
  }

  //retrieve reservation and passenger ticket details
  getReservationDetails(
    reservationId: number
  ): Observable<ReservationDetailsResponse> {
    return this.http.get<ReservationDetailsResponse>(
      `${this.apiUrl}${reservationId}/details/`,
      { withCredentials: true }
    );
  }

  //cancel an existing reservation
  cancelReservation(
    reservationId: number
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}${reservationId}/cancel/`,
      {},
      { withCredentials: true }
    );
  }

  //edit passenger information and seat assignments
  editReservation(
    reservationId: number,
    reservation: EditReservationRequest
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}${reservationId}/edit/`,
      reservation,
      { withCredentials: true }
    );
  }

  //retrieve occupied seats for a specific flight
  getOccupiedSeats(
    flight: FlightSeatRequest
  ): Observable<FlightSeatResponse> {
    return this.http.get<FlightSeatResponse>(
      `${this.apiUrl}seats/occupied/`,
      {
        params: {
          airline_name: flight.airline_name,
          flight_number: flight.flight_number,
          departure_airport: flight.departure_airport,
          arrival_airport: flight.arrival_airport,
          departure_time: flight.departure_time
        },
        withCredentials: true
      }
    );
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AirportSearch } from '../airport-search/airport-search';

import {
  ReservationsService,
  CustomerReservation,
  ReservationDetailsResponse,
  EditReservationPassenger,
  EditReservationRequest
} from '../services/reservations.service';

import { AuthService } from '../services/auth.service';
import { DatePipe } from '@angular/common';
import { FlightService, Flight } from '../services/flights.service';

@Component({
  imports: [RouterLink, FormsModule, DatePipe, AirportSearch],
  selector: 'app-reservations-page',
  styleUrl: './reservations-page.css',
  templateUrl: './reservations-page.html',
})
export class ReservationsPage implements OnInit {
  constructor(
    private reservationService: ReservationsService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router,
    private flightService: FlightService
  ) {}

  //customer reservations
  reservations: CustomerReservation[] = [];
  loadingReservations = false;
  reservationError = '';

  //logout popup
  showLogoutPopup = false;

  //view tickets popup
  selectedReservation: ReservationDetailsResponse | null = null;
  showDetailsPopup = false;
  loadingDetails = false;
  detailsError = '';

  //cancel reservation popup
  showCancelPopup = false;
  reservationToCancel: CustomerReservation | null = null;
  cancellingReservation = false;
  cancelError = '';

  //edit reservation popup
  showEditPopup = false;
  reservationToEdit: CustomerReservation | null = null;
  editPassengers: EditReservationPassenger[] = [];
  loadingEditPassengers = false;
  editingReservation = false;
  editError = '';

  showChangeFlightPopup = false;
  reservationToChange: CustomerReservation | null = null;
  changeFlightStep: 'search' | 'seats' | 'review' = 'search';
  changeOrigin = '';
  changeDestination = '';
  changeDate = '';
  replacementFlights: Flight[] = [];
  selectedReplacementFlight: Flight | null = null;
  changePassengers: EditReservationPassenger[] = [];
  occupiedReplacementSeats: string[] = [];
  searchingChangeFlights = false;
  loadingReplacementSeats = false;
  changingFlight = false;
  changeFlightError = '';

  //seat selection options
  seatRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  ngOnInit(): void {
    this.loadReservations();
  }

  //retrieve active customer reservations
  loadReservations(): void {
    this.loadingReservations = true;
    this.reservationError = '';

    this.reservationService.getCustomerReservations().subscribe({
      next: (response: CustomerReservation[]) => {
        this.reservations = response.filter(
          reservation => reservation.status !== 'Cancelled'
        );

        this.loadingReservations = false;
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error retrieving reservations:', error);

        this.reservationError = 'Unable to load reservations.';
        this.loadingReservations = false;
        this.cdr.markForCheck();
      }
    });
  }

  //check the seven-day modification restriction
  canModifyReservation(reservation: CustomerReservation): boolean {
    if (reservation.status !== 'Confirmed') {
      return false;
    }

    const departureDate = new Date(reservation.departure_time);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    return departureDate.getTime() - Date.now() > sevenDays;
  }

  //retrieve and display passenger tickets
  openReservationDetails(reservationId: number): void {
    this.selectedReservation = null;
    this.detailsError = '';
    this.loadingDetails = true;
    this.showDetailsPopup = true;

    this.reservationService.getReservationDetails(reservationId).subscribe({
      next: (response: ReservationDetailsResponse) => {
        this.selectedReservation = response;
        this.loadingDetails = false;
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error retrieving tickets:', error);

        this.detailsError = 'Unable to load reservation tickets.';
        this.loadingDetails = false;
        this.cdr.markForCheck();
      }
    });
  }

  //close ticket popup
  closeReservationDetails(): void {
    this.showDetailsPopup = false;
    this.selectedReservation = null;
    this.detailsError = '';
  }

  //open cancellation confirmation popup
  openCancelPopup(reservation: CustomerReservation): void {
    if (!this.canModifyReservation(reservation)) {
      return;
    }

    this.reservationToCancel = reservation;
    this.cancelError = '';
    this.showCancelPopup = true;
  }

  //close cancellation popup
  closeCancelPopup(): void {
    if (this.cancellingReservation) {
      return;
    }

    this.showCancelPopup = false;
    this.reservationToCancel = null;
    this.cancelError = '';
  }

  //cancel the selected reservation
  confirmCancellation(): void {
    if (!this.reservationToCancel || this.cancellingReservation) {
      return;
    }

    this.cancellingReservation = true;
    this.cancelError = '';

    this.reservationService.cancelReservation(
      this.reservationToCancel.reservation_id
    ).subscribe({
      next: (response: { message: string }) => {
        console.log('Reservation cancelled:', response);

        this.cancellingReservation = false;
        this.closeCancelPopup();
        this.loadReservations();
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        console.error('Cancellation error:', error);

        this.cancellingReservation = false;
        this.cancelError =
          error.error?.message || 'Unable to cancel reservation.';

        this.cdr.markForCheck();
      }
    });
  }

  //open edit popup and retrieve passenger information
  openEditPopup(reservation: CustomerReservation): void {
    if (!this.canModifyReservation(reservation)) {
      return;
    }

    this.reservationToEdit = reservation;
    this.editPassengers = [];
    this.editError = '';
    this.loadingEditPassengers = true;
    this.showEditPopup = true;

    this.reservationService.getReservationDetails(
      reservation.reservation_id
    ).subscribe({
      next: (response: ReservationDetailsResponse) => {
        if (!this.showEditPopup ||
            this.reservationToEdit?.reservation_id !== reservation.reservation_id) {
          return;
        }

        this.editPassengers = response.passengers.map(passenger => ({
          passenger_id: passenger.passenger_id,
          first_name: passenger.first_name,
          last_name: passenger.last_name,
          date_of_birth: passenger.date_of_birth,
          seat_number: passenger.seat_number ?? ''
        }));

        this.loadingEditPassengers = false;
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        if (!this.showEditPopup ||
            this.reservationToEdit?.reservation_id !== reservation.reservation_id) {
          return;
        }

        console.error('Error loading passengers:', error);

        this.editError = 'Unable to load passenger information.';
        this.loadingEditPassengers = false;
        this.cdr.markForCheck();
      }
    });
  }

  //close edit popup
  closeEditPopup(): void {
    if (this.editingReservation) {
      return;
    }

    this.showEditPopup = false;
    this.reservationToEdit = null;
    this.editPassengers = [];
    this.editError = '';
    this.loadingEditPassengers = false;
  }

  //validate and save passenger changes
  saveReservationChanges(): void {
    if (!this.reservationToEdit ||
        this.editingReservation ||
        this.loadingEditPassengers ||
        this.editPassengers.length === 0) {
      return;
    }

    if (!this.canModifyReservation(this.reservationToEdit)) {
      this.editError = 'This reservation is no longer eligible for editing.';
      return;
    }

    const passengers = this.editPassengers.map(passenger => ({
      passenger_id: passenger.passenger_id,
      first_name: passenger.first_name.trim(),
      last_name: passenger.last_name.trim(),
      date_of_birth: passenger.date_of_birth,
      seat_number: passenger.seat_number.trim().toUpperCase()
    }));

    //check for missing information and invalid dates
    for (const passenger of passengers) {
      if (!passenger.first_name ||
          !passenger.last_name ||
          !passenger.date_of_birth ||
          !passenger.seat_number) {
        this.editError = 'All passenger fields are required.';
        return;
      }

      const birthDate = new Date(passenger.date_of_birth + 'T00:00:00');

      if (Number.isNaN(birthDate.getTime()) ||
          birthDate.getTime() > Date.now()) {
        this.editError = 'Enter a valid date of birth.';
        return;
      }

      if (!/^(10|[1-9])[A-F]$/.test(passenger.seat_number)) {
        this.editError = 'Select a valid seat from rows 1 through 10.';
        return;
      }
    }

    //prevent duplicate seats within the same reservation
    const seats = passengers.map(passenger => passenger.seat_number);

    if (new Set(seats).size !== seats.length) {
      this.editError = 'Each passenger must have a different seat.';
      return;
    }

    const reservationData: EditReservationRequest = {
      passengers
    };

    this.editingReservation = true;
    this.editError = '';

    this.reservationService.editReservation(
      this.reservationToEdit.reservation_id,
      reservationData
    ).subscribe({
      next: (response: { message: string }) => {
        console.log('Reservation updated:', response);

        this.editingReservation = false;
        this.closeEditPopup();
        this.loadReservations();
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error editing reservation:', error);

        this.editingReservation = false;

        if (error.status === 409) {
          this.editError = 'One or more selected seats are already taken.';
        } else {
          this.editError =
            error.error?.message || 'Unable to update reservation.';
        }

        this.cdr.markForCheck();
      }
    });
  }

  removePassenger(passengerId: number): void {
    if (this.editingReservation || this.loadingEditPassengers) return;
    if (this.editPassengers.length <= 1) {
      this.editError = 'At least one passenger must remain.';
      return;
    }
    this.editPassengers = this.editPassengers.filter(p => p.passenger_id !== passengerId);
    this.editError = '';
  }

  
  openChangeFlightPopup(reservation: CustomerReservation): void {
    if (!this.canModifyReservation(reservation)) {
      return;
    }

    this.reservationToChange = reservation;

    // Start with empty airport fields
    this.changeOrigin = '';
    this.changeDestination = '';
    this.changeDate = reservation.departure_date;

    // Reset popup state
    this.changeFlightStep = 'search';
    this.replacementFlights = [];
    this.selectedReplacementFlight = null;
    this.changePassengers = [];
    this.occupiedReplacementSeats = [];

    this.searchingChangeFlights = false;
    this.loadingReplacementSeats = false;
    this.changeFlightError = '';

    this.showChangeFlightPopup = true;

    // Retrieve passengers for this reservation
    this.reservationService.getReservationDetails(
      reservation.reservation_id
    ).subscribe({
      next: details => {
        if (
          !this.showChangeFlightPopup ||
          this.reservationToChange?.reservation_id !== reservation.reservation_id
        ) {
          return;
        }

        this.changePassengers = details.passengers.map(p => ({
          passenger_id: p.passenger_id,
          first_name: p.first_name,
          last_name: p.last_name,
          date_of_birth: p.date_of_birth,
          seat_number: ''
        }));

        this.cdr.markForCheck();
      },

      error: () => {
        if (!this.showChangeFlightPopup) {
          return;
        }

        this.changeFlightError = 'Unable to load passengers.';
        this.cdr.markForCheck();
      }
    });
  }

  
  closeChangeFlightPopup(): void {
    if (this.changingFlight) {
      return;
    }

    this.showChangeFlightPopup = false;
    this.reservationToChange = null;

    this.changeFlightStep = 'search';

    this.changeOrigin = '';
    this.changeDestination = '';
    this.changeDate = '';

    this.replacementFlights = [];
    this.selectedReplacementFlight = null;
    this.changePassengers = [];
    this.occupiedReplacementSeats = [];

    this.searchingChangeFlights = false;
    this.loadingReplacementSeats = false;
    this.changeFlightError = '';

    this.cdr.markForCheck();
  }

  //function to validate fields
  validateChangeFlightFields(): boolean {
    this.changeFlightError = '';

    const origin = this.changeOrigin.trim().toUpperCase();
    const destination = this.changeDestination.trim().toUpperCase();

    if (!origin || !destination || !this.changeDate) {
      this.changeFlightError =
        'Please select a departure airport, arrival airport, and departure date.';
      return false;
    }

    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
      this.changeFlightError = 'Please select valid airports.';
      return false;
    }

    if (origin === destination) {
      this.changeFlightError =
        'Departure and arrival airports cannot be the same.';
      return false;
    }

    return true;
  }

  onChangeOriginSelected(airport: string): void {
    this.changeOrigin = airport;
    this.replacementFlights = [];
    this.changeFlightError = '';
  }

  onChangeDestinationSelected(airport: string): void {
    this.changeDestination = airport;
    this.replacementFlights = [];
    this.changeFlightError = '';
  }

    
  searchReplacementFlights(): void {
    if (this.searchingChangeFlights) {
      return;
    }

    // Clear previous search results
    this.replacementFlights = [];
    this.selectedReplacementFlight = null;
    this.changeFlightError = '';

    // Validate required fields
    if (!this.validateChangeFlightFields()) {
      this.cdr.markForCheck();
      return;
    }

    const origin = this.changeOrigin.trim().toUpperCase();
    const destination = this.changeDestination.trim().toUpperCase();
    const departureDate = this.changeDate;

    // Validate departure date
    const departure = new Date(departureDate + 'T00:00:00');

    if (
      Number.isNaN(departure.getTime()) ||
      departure.getTime() <= Date.now() + 7 * 86400000
    ) {
      this.changeFlightError =
        'Choose a departure date more than seven days away.';
      return;
    }

    // Ensure passenger information is loaded
    if (this.changePassengers.length < 1) {
      this.changeFlightError =
        'Passenger information is not available yet.';
      return;
    }

    this.searchingChangeFlights = true;

    this.flightService.searchFlights(
      origin,
      destination,
      departureDate,
      this.changePassengers.length
    ).subscribe({
      next: response => {
        this.searchingChangeFlights = false;

        // Ignore results if the popup was closed or fields changed
        if (
          !this.showChangeFlightPopup ||
          this.changeOrigin.trim().toUpperCase() !== origin ||
          this.changeDestination.trim().toUpperCase() !== destination ||
          this.changeDate !== departureDate
        ) {
          return;
        }

        this.replacementFlights = response.flights.filter(
          flight => flight.stops === 0
        );

        if (this.replacementFlights.length === 0) {
          this.changeFlightError = 'No direct flights were found.';
        }

        this.cdr.markForCheck();
      },

      error: () => {
        this.searchingChangeFlights = false;

        if (!this.showChangeFlightPopup) {
          return;
        }

        this.changeFlightError =
          'Unable to search for replacement flights.';

        this.cdr.markForCheck();
      }
    });
  }

  selectReplacementFlight(flight: Flight): void {
    this.selectedReplacementFlight = flight;
    this.changeFlightStep = 'seats';
    this.changeFlightError = '';
    this.loadingReplacementSeats = true;
    this.changePassengers = this.changePassengers.map(p => ({...p, seat_number: ''}));
    this.reservationService.getOccupiedSeats({
      airline_name: flight.airline,
      flight_number: flight.flight_number,
      departure_airport: flight.origin,
      arrival_airport: flight.destination,
      departure_time: flight.departure_time
    }).subscribe({
      next: result => {
        if (this.selectedReplacementFlight?.offer_id !== flight.offer_id) return;
        this.occupiedReplacementSeats = result.occupied_seats;
        this.loadingReplacementSeats = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.changeFlightError = 'Unable to retrieve occupied seats.';
        this.loadingReplacementSeats = false;
        this.cdr.markForCheck();
      }
    });
  }

  reviewFlightChange(): void {
    if (this.loadingReplacementSeats || !this.selectedReplacementFlight) return;
    const seats = this.changePassengers.map(p => p.seat_number);
    if (seats.some(s => !s || this.occupiedReplacementSeats.includes(s)) || new Set(seats).size !== seats.length) {
      this.changeFlightError = 'Choose a different available seat for each passenger.';
      return;
    }
    this.changeFlightError = '';
    this.changeFlightStep = 'review';
  }

  flightPriceDifference(): string {
    if (!this.reservationToChange || !this.selectedReplacementFlight) return '';
    const difference = Number(this.selectedReplacementFlight.price) - Number(this.reservationToChange.total_price);
    return `${difference >= 0 ? '+' : '-'}${Math.abs(difference).toFixed(2)}`;
  }

  confirmFlightChange(): void {
    if (!this.reservationToChange || !this.selectedReplacementFlight || this.changingFlight) return;
    if (!this.canModifyReservation(this.reservationToChange)) {
      this.changeFlightError = 'This reservation can no longer be changed.';
      return;
    }
    this.changingFlight = true;
    this.changeFlightError = '';
    this.reservationService.changeFlight(this.reservationToChange.reservation_id, {
      offer_id: this.selectedReplacementFlight.offer_id,
      passengers: this.changePassengers.map(p => ({ passenger_id: p.passenger_id, seat_number: p.seat_number }))
    }).subscribe({
      next: () => {
        this.changingFlight = false;
        this.closeChangeFlightPopup();
        this.loadReservations();
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.changingFlight = false;
        this.changeFlightError = error.error?.message || 'Unable to change flight. Please search again.';
        this.cdr.markForCheck();
      }
    });
  }

  //open logout popup
  openLogoutPopup(): void {
    this.showLogoutPopup = true;
  }

  //close logout popup
  closeLogoutPopup(): void {
    this.showLogoutPopup = false;
  }

  //confirm logout
  confirmLogout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Logout successful:', response);

        this.showLogoutPopup = false;
        this.router.navigate(['/user-home-page']);
      },

      error: (error: HttpErrorResponse) => {
        console.error('Logout error:', error);
      }
    });
  }
}

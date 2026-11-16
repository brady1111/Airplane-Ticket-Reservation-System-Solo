import { Component, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FlightService, Flight } from '../services/flights.service';
import { AirportSearch } from '../airport-search/airport-search';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../services/booking.service';
import {
  ReservationsService,
  FlightSeatRequest,
  FlightSeatResponse
} from '../services/reservations.service';

//interface for booking passenger information
interface BookingPassenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  seatNumber: string;
}

//component for the customer home page
@Component({
  imports: [RouterLink, AirportSearch, DatePipe, FormsModule],
  selector: 'app-customer-home-page',
  styleUrl: './customer-home-page.css',
  templateUrl: './customer-home-page.html',
})
export class CustomerHomePage {

  //current step in the booking process
  bookingStep: 'flight' | 'passengers' | 'seats' | 'review' = 'flight';

  bookingPassengers: BookingPassenger[] = [];
  bookingError: string = '';

  customerInfo: any = null;
  useAccountInfo: boolean = true;

  //airplane seat map
  seatRows: number[] = Array.from({ length: 10 }, (_, i) => i + 1);
  seatLetters: string[] = ['A', 'B', 'C', 'D', 'E', 'F'];

  //tracks which passenger is selecting a seat
  activePassengerIndex: number = 0;

  //occupied seats retrieved from PostgreSQL through Django
  occupiedSeats: string[] = [];
  loadingOccupiedSeats: boolean = false;
  seatAvailabilityLoaded: boolean = false;

  //prevents outdated seat requests from updating the current flight
  private seatRequestId = 0;

  constructor(
    private authService: AuthService,
    private flightService: FlightService,
    private bookingService: BookingService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private reservationsService: ReservationsService
  ) {}

  ngOnInit(): void {
    this.loadCustomerInfo();

    //retrieve any pending booking after login
    const pendingBooking = this.bookingService.getPendingBooking();

    if (pendingBooking) {
      this.passengers = pendingBooking.passengers;
      this.bookFlight(pendingBooking.flight);
      this.bookingService.clearPendingBooking();
    }
  }

  //load the logged-in customer's information
  loadCustomerInfo(): void {
    this.authService.checkLoginStatus().subscribe({
      next: (response) => {
        this.customerInfo = response;
        this.fillMainPassenger();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading customer information:', error);
      }
    });
  }

  //logout popup
  showLogoutPopup: boolean = false;

  //flight search input fields
  departureAirport: string = '';
  arrivalAirport: string = '';
  departureDate: string = '';
  passengers: number = 1;

  //flight search results
  flights: Flight[] = [];
  searchingFlights: boolean = false;
  searchError: string = '';
  hasSearched: boolean = false;

  //minimum and maximum departure dates
  minDepartureDate: string = this.formatDate(new Date());
  maxDepartureDate: string = this.getMaxDepartureDate();

  //format a date as YYYY-MM-DD
  formatDate(date: Date): string {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  //calculate maximum departure date (330 days)
  getMaxDepartureDate(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 330);

    return this.formatDate(maxDate);
  }

  //convert ISO duration into readable hours and minutes
  formatDuration(duration: string): string {
    const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);

    if (!match) {
      return duration;
    }

    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);

    return `${hours}h ${minutes}m`;
  }

  //search for available flights
  searchFlights(): void {
    this.searchError = '';
    this.flights = [];
    this.hasSearched = false;

    //check required fields
    if (
      !this.departureAirport.trim() ||
      !this.arrivalAirport.trim() ||
      !this.departureDate
    ) {
      this.searchError = 'Please complete all flight search fields.';
      return;
    }

    //prevent identical airports
    if (this.departureAirport === this.arrivalAirport) {
      this.searchError = 'Departure and arrival airports must be different.';
      return;
    }

    //refresh minimum and maximum dates
    this.minDepartureDate = this.formatDate(new Date());
    this.maxDepartureDate = this.getMaxDepartureDate();

    //prevent past departure dates
    if (this.departureDate < this.minDepartureDate) {
      this.searchError = 'Departure date cannot be in the past.';
      return;
    }

    //prevent searching too far into the future
    if (this.departureDate > this.maxDepartureDate) {
      this.searchError =
        'Flights can only be searched up to 330 days in advance.';
      return;
    }

    //validate passenger count
    if (
      !Number.isInteger(this.passengers) ||
      this.passengers < 1 ||
      this.passengers > 5
    ) {
      this.searchError = 'Please select between 1 and 5 passengers.';
      return;
    }

    this.searchingFlights = true;

    //send search request to Django
    this.flightService.searchFlights(
      this.departureAirport,
      this.arrivalAirport,
      this.departureDate,
      this.passengers
    ).subscribe({
      next: (response) => {
        console.log('Available flights:', response);

        this.flights = response.flights;
        this.searchingFlights = false;
        this.hasSearched = true;

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Flight search error:', error);

        this.searchError =
          typeof error.error?.message === 'string'
            ? error.error.message
            : 'Unable to search for flights. Please try again.';

        this.searchingFlights = false;
        this.hasSearched = true;

        this.cdr.markForCheck();
      }
    });
  }

  //selected flight for booking
  selectedFlight: Flight | null = null;

  //fill the main passenger using account information
  fillMainPassenger(): void {
    if (!this.bookingPassengers.length) {
      return;
    }

    const passenger = this.bookingPassengers[0];

    if (this.useAccountInfo && this.customerInfo) {
      passenger.firstName = this.customerInfo.f_name || '';
      passenger.lastName = this.customerInfo.l_name || '';
      passenger.dateOfBirth = this.customerInfo.date_of_birth || '';
    }
  }

  //toggle account information for the main passenger
  toggleAccountInfo(): void {
    if (this.useAccountInfo) {
      this.fillMainPassenger();
    } else if (this.bookingPassengers.length) {
      this.bookingPassengers[0] = {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        seatNumber: ''
      };
    }
  }

  //open the booking popup for a selected flight
  bookFlight(flight: Flight): void {
    this.selectedFlight = flight;
    this.bookingStep = 'flight';
    this.bookingError = '';
    this.activePassengerIndex = 0;

    //reset seat availability for the new flight
    this.seatRequestId++;
    this.occupiedSeats = [];
    this.loadingOccupiedSeats = false;
    this.seatAvailabilityLoaded = false;

    this.useAccountInfo = true;

    this.bookingPassengers = Array.from(
      { length: this.passengers },
      () => ({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        seatNumber: ''
      })
    );

    this.fillMainPassenger();
  }

  //close the booking popup
  closeFlightPopup(): void {
    this.seatRequestId++;

    this.selectedFlight = null;
    this.bookingStep = 'flight';
    this.bookingPassengers = [];
    this.bookingError = '';
    this.activePassengerIndex = 0;

    this.occupiedSeats = [];
    this.loadingOccupiedSeats = false;
    this.seatAvailabilityLoaded = false;
  }

  //proceed to passenger information
  continueBooking(): void {
    if (!this.selectedFlight) {
      return;
    }

    this.bookingStep = 'passengers';
  }

  //validate passengers and proceed to seat selection
  continueToSeats(): void {
    this.bookingError = '';

    for (const passenger of this.bookingPassengers) {

      //check required passenger information
      if (
        !passenger.firstName.trim() ||
        !passenger.lastName.trim() ||
        !passenger.dateOfBirth
      ) {
        this.bookingError =
          'Please complete all information for each passenger.';
        return;
      }

      //prevent future dates of birth
      if (passenger.dateOfBirth > this.formatDate(new Date())) {
        this.bookingError =
          'Passenger date of birth cannot be in the future.';
        return;
      }
    }

    this.activePassengerIndex = 0;
    this.bookingStep = 'seats';

    //load occupied seats when the seat map opens
    this.loadOccupiedSeats();
  }

  //retrieve occupied seats from Django
  loadOccupiedSeats(onLoaded?: () => void): void {
    if (!this.selectedFlight) {
      return;
    }

    const flight = this.selectedFlight;
    const requestId = ++this.seatRequestId;

    const flightInfo: FlightSeatRequest = {
      airline_name: flight.airline,
      flight_number: flight.flight_number,
      departure_airport: flight.origin,
      arrival_airport: flight.destination,
      departure_time: flight.departure_time
    };

    this.loadingOccupiedSeats = true;
    this.seatAvailabilityLoaded = false;
    this.bookingError = '';

    this.reservationsService.getOccupiedSeats(flightInfo).subscribe({
      next: (response: FlightSeatResponse) => {

        //ignore responses for an old flight or request
        if (
          requestId !== this.seatRequestId ||
          this.selectedFlight !== flight
        ) {
          return;
        }

        this.occupiedSeats = response.occupied_seats;
        this.loadingOccupiedSeats = false;
        this.seatAvailabilityLoaded = true;

        //clear seats that have become occupied
        let seatsChanged = false;

        for (const passenger of this.bookingPassengers) {
          if (
            passenger.seatNumber &&
            this.isSeatOccupied(passenger.seatNumber)
          ) {
            passenger.seatNumber = '';
            seatsChanged = true;
          }
        }

        if (seatsChanged) {
          this.bookingError =
            'One or more selected seats are now occupied. Please select another seat.';
          this.bookingStep = 'seats';
        } else if (onLoaded) {
          onLoaded();
        }

        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        if (
          requestId !== this.seatRequestId ||
          this.selectedFlight !== flight
        ) {
          return;
        }

        console.error('Error loading occupied seats:', error);

        this.occupiedSeats = [];
        this.loadingOccupiedSeats = false;
        this.seatAvailabilityLoaded = false;

        this.bookingError =
          'Unable to check seat availability. Please retry.';

        this.cdr.markForCheck();
      }
    });
  }

  //check whether a seat is occupied
  isSeatOccupied(seatNumber: string): boolean {
    return this.occupiedSeats.includes(seatNumber);
  }

  //check whether a passenger has selected a seat
  isSeatSelected(seatNumber: string): boolean {
    return this.bookingPassengers.some(
      passenger => passenger.seatNumber === seatNumber
    );
  }

  //get the passenger assigned to a seat
  getSeatPassengerIndex(seatNumber: string): number {
    return this.bookingPassengers.findIndex(
      passenger => passenger.seatNumber === seatNumber
    );
  }

  //select the passenger who is choosing a seat
  selectPassenger(index: number): void {
    if (
      index < 0 ||
      index >= this.bookingPassengers.length
    ) {
      return;
    }

    this.activePassengerIndex = index;
    this.bookingError = '';
  }

  //assign a seat to the selected passenger
  selectSeat(seatNumber: string): void {
    this.bookingError = '';

    //prevent seat selection before availability loads
    if (
      this.loadingOccupiedSeats ||
      !this.seatAvailabilityLoaded
    ) {
      this.bookingError =
        'Wait for seat availability to load.';
      return;
    }

    //prevent selecting an occupied seat
    if (this.isSeatOccupied(seatNumber)) {
      this.bookingError =
        'This seat is already occupied.';
      return;
    }

    //prevent assigning the same seat to two passengers
    const assignedPassenger =
      this.getSeatPassengerIndex(seatNumber);

    if (
      assignedPassenger !== -1 &&
      assignedPassenger !== this.activePassengerIndex
    ) {
      this.bookingError =
        'This seat has already been selected by another passenger.';
      return;
    }

    const passenger =
      this.bookingPassengers[this.activePassengerIndex];

    if (!passenger) {
      return;
    }

    //clicking the same seat again deselects it
    if (passenger.seatNumber === seatNumber) {
      passenger.seatNumber = '';
      return;
    }

    passenger.seatNumber = seatNumber;

    //automatically move to the next passenger without a seat
    const nextPassenger = this.bookingPassengers.findIndex(
      passenger => !passenger.seatNumber
    );

    if (nextPassenger !== -1) {
      this.activePassengerIndex = nextPassenger;
    }
  }

  //validate seat selections
  validateSeatSelection(): boolean {

    //each passenger must have a seat
    if (
      this.bookingPassengers.some(
        passenger => !passenger.seatNumber
      )
    ) {
      this.bookingError =
        'Please select a seat for every passenger.';
      return false;
    }

    const selectedSeats = this.bookingPassengers.map(
      passenger => passenger.seatNumber
    );

    //prevent duplicate seat selections
    if (
      new Set(selectedSeats).size !== selectedSeats.length
    ) {
      this.bookingError =
        'Each passenger must have a different seat.';
      return false;
    }

    //prevent selecting occupied seats
    if (
      selectedSeats.some(
        seat => this.isSeatOccupied(seat)
      )
    ) {
      this.bookingError =
        'One or more selected seats are unavailable.';
      return false;
    }

    return true;
  }

  //proceed to reservation review
  continueToReview(): void {
    this.bookingError = '';

    if (this.loadingOccupiedSeats) {
      this.bookingError =
        'Wait for seat availability to load.';
      return;
    }

    if (!this.seatAvailabilityLoaded) {
      this.bookingError =
        'Please retry loading seat availability.';
      return;
    }

    if (!this.validateSeatSelection()) {
      return;
    }

    //check availability again before reviewing
    this.loadOccupiedSeats(() => {
      if (this.validateSeatSelection()) {
        this.bookingStep = 'review';
      }
    });
  }

  //confirm the reservation
  confirmReservation(): void {
    if (
      !this.selectedFlight ||
      this.bookingStep !== 'review'
    ) {
      this.bookingError =
        'Please complete your reservation first.';
      return;
    }

    this.bookingError = '';

    const reservation = {
      offer_id: this.selectedFlight.offer_id,
      passengers: this.bookingPassengers.map(passenger => ({
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        dateOfBirth: passenger.dateOfBirth,
        seatNumber: passenger.seatNumber
      }))
    };

    //send reservation to Django
    this.reservationsService.createReservation(reservation).subscribe({
      next: (response) => {
        alert(
          'Reservation confirmed successfully!\n' +
          'Booking Reference: ' + response.booking_reference
        );

        this.closeFlightPopup();
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        this.bookingError =
          error.error?.message ||
          'Unable to save your reservation. Please try again.';

        //return to seat selection if another customer took a seat
        if (error.status === 409) {
          this.bookingStep = 'seats';
          this.loadOccupiedSeats();
        }

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

  //confirm customer logout
  confirmLogout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Logout successful:', response);

        this.closeLogoutPopup();
        this.router.navigate(['/user-home-page']);
      },

      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }
}


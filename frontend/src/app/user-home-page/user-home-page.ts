
import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FlightService, Flight } from '../services/flights.service';
import { AirportSearch } from '../airport-search/airport-search';
import { DatePipe } from '@angular/common';
import { BookingService } from '../services/booking.service';

@Component({
  imports: [RouterLink, AirportSearch, DatePipe],
  selector: 'app-user-home-page',
  styleUrl: './user-home-page.css',
  templateUrl: './user-home-page.html',
})
export class UserHomePage {

  constructor(
    private flightService: FlightService,
    private bookingService: BookingService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  //flight search input fields
  departureAirport: string = '';
  arrivalAirport: string = '';
  departureDate: string = '';

  //stores available flights returned by the API
  flights: Flight[] = [];

  //tracks whether the search is in progress
  searchingFlights: boolean = false;

  //stores flight search errors
  searchError: string = '';

  //tracks whether a search has been completed
  hasSearched: boolean = false;

  //number of passengers
  passengers: number = 1;

  //tracks whether the booking popup is displayed
  showBookingPopup: boolean = false;

  //method to select a flight and open the booking popup
  bookFlight(flight: Flight): void {
    this.bookingService.savePendingBooking(flight, this.passengers);
    this.showBookingPopup = true;
  }

  //method to navigate to the login page
  continueToLogin(): void {
    this.showBookingPopup = false;
    this.router.navigate(['/login']);
  }

  //method to navigate to the create account page
  continueToCreateAccount(): void {
    this.showBookingPopup = false;
    this.router.navigate(['/create-account']);
  }

  //method to close the booking popup
  closeBookingPopup(): void {
    this.showBookingPopup = false;
    this.bookingService.clearPendingBooking();
  }

  //method to get the maximum allowed departure date (330 days from today)
  getMaxDepartureDate(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 330);

    return maxDate.getFullYear() + '-' +
      String(maxDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(maxDate.getDate()).padStart(2, '0');
  }

  getMinDepartureDate(): string {
    const today = new Date();

    return today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
  }

  minDepartureDate: string = this.getMinDepartureDate();
  maxDepartureDate: string = this.getMaxDepartureDate();

  formatDuration(duration: string): string {
    const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);

    if (!match) {
      return duration;
    }

    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);

    return `${hours}h ${minutes}m`;
  }

  //method to update the number of passengers and reset search results
  updatePassengers(value: string): void {
    this.passengers = Number(value);
    this.flights = [];
    this.hasSearched = false;
    this.searchError = '';
  }

  //method to search for available flights
  searchFlights(): void {
    //clear previous results and errors
    this.searchError = '';
    this.flights = [];
    this.hasSearched = false;

    //validate search inputs
    if (!this.departureAirport.trim() ||
        !this.arrivalAirport.trim() ||
        !this.departureDate) {

      this.searchError = 'Please complete all flight search fields.';
      return;
    }

    //prevent searching for flights beyond the maximum allowed date
    if (this.departureDate > this.maxDepartureDate) {
      this.searchError = 'Flights can only be searched up to 330 days in advance.';
      return;
    }

    //prevent searching for the same departure and arrival airport
    if (this.departureAirport.trim().toUpperCase() ===
        this.arrivalAirport.trim().toUpperCase()) {

      this.searchError = 'Departure and arrival airports must be different.';
      return;
    }

    //get today's date using the user's local timezone
    const today = new Date();
    const currentDate =
      today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    //prevent searching for flights on past dates
    if (this.departureDate < currentDate) {
      this.searchError = 'Departure date cannot be in the past.';
      return;
    }

    //validate passenger count
    if (!Number.isInteger(this.passengers) ||
        this.passengers < 1 ||
        this.passengers > 5) {

      this.searchError = 'Please select between 1 and 5 passengers.';
      return;
    }

    this.searchingFlights = true;

    //send flight search request to Django
    this.flightService.searchFlights(
      this.departureAirport.trim().toUpperCase(),
      this.arrivalAirport.trim().toUpperCase(),
      this.departureDate,
      this.passengers
    ).subscribe({
      next: (response) => {
        console.log('Available flights:', response);

        //store returned flights
        this.flights = response.flights;

        this.searchingFlights = false;
        this.hasSearched = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error searching flights:', error);

        this.searchError =
          error.error?.message ||
          error.error?.error ||
          'Unable to search for flights. Please try again.';

        this.searchingFlights = false;
        this.hasSearched = true;
        this.cdr.markForCheck();
      }
    });
  }
}

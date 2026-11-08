
import { Component, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FlightService, Flight } from '../services/flights.service';
import { AirportSearch } from '../airport-search/airport-search';

@Component({
  imports: [RouterLink, AirportSearch, DatePipe],
  selector: 'app-customer-home-page',
  styleUrl: './customer-home-page.css',
  templateUrl: './customer-home-page.html',
})
export class CustomerHomePage {

  constructor(
    private authService: AuthService,
    private flightService: FlightService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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

  //calculate the maximum departure date (330 days)
  getMaxDepartureDate(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 330);

    return this.formatDate(maxDate);
  }

  //convert ISO duration to readable hours and minutes
  formatDuration(duration: string): string {

    const match = duration.match(
      /^PT(?:(\d+)H)?(?:(\d+)M)?$/
    );

    if (!match) {
      return duration;
    }

    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);

    return `${hours}h ${minutes}m`;
  }

  //search for available flights
  searchFlights(): void {

    //clear previous results and errors
    this.searchError = '';
    this.flights = [];
    this.hasSearched = false;

    //check required fields
    if (!this.departureAirport.trim() ||
        !this.arrivalAirport.trim() ||
        !this.departureDate) {

      this.searchError = 'Please complete all flight search fields.';
      return;
    }

    //prevent identical departure and arrival airports
    if (this.departureAirport === this.arrivalAirport) {

      this.searchError =
        'Departure and arrival airports must be different.';
      return;
    }

    //refresh minimum and maximum dates
    this.minDepartureDate = this.formatDate(new Date());
    this.maxDepartureDate = this.getMaxDepartureDate();

    //prevent searching past dates
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
    if (!Number.isInteger(this.passengers) ||
        this.passengers < 1 ||
        this.passengers > 5) {

      this.searchError = 'Please select between 1 and 5 passengers.';
      return;
    }

    //start loading
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

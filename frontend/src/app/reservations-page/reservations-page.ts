import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ReservationService } from '../services/reservation';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

//interface for reservation information
interface Reservation {
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
}

@Component({
  imports: [RouterLink],
  selector: 'app-reservations-page',
  styleUrl: './reservations-page.css',
  templateUrl: './reservations-page.html',
})
export class ReservationsPage implements OnInit {
  constructor(private reservationService: ReservationService, private cdr: ChangeDetectorRef, private authService: AuthService,
  private router: Router) {}

  //array to hold the customer's reservations
  reservations: Reservation[] = [];

  //tracks whether reservations are loading
  loadingReservations = false;

  //holds any error messages related to reservations
  reservationError = '';

  //runs when the reservations page is loaded
  ngOnInit(): void {
    this.loadReservations();
  }

  //method to retrieve the customer's reservations
  loadReservations(): void {
    this.loadingReservations = true;
    this.reservationError = '';

    //retrieve the reservations from the backend
    this.reservationService.getCustomerReservations().subscribe({
      //on successful retrieval of reservations
      next: (response: Reservation[]) => {
        this.reservations = response;
        this.loadingReservations = false;

        console.log('Customer reservations:', response);

        //notify Angular that the data has changed
        this.cdr.markForCheck();
      },

      //on error while retrieving reservations
      error: (error) => {
        console.error('Error retrieving reservations:', error);
        this.reservationError = 'Unable to load reservations.';
        this.loadingReservations = false;

        //notify Angular that the data has changed
        this.cdr.markForCheck();
      }
    });
  } //end of loadReservations method

  //controls whether the logout popup is displayed
  showLogoutPopup = false;

  //method to display the logout popup
  openLogoutPopup(): void {
    this.showLogoutPopup = true;
  }

  //method to close the logout popup
  closeLogoutPopup(): void {
    this.showLogoutPopup = false;
  }

  //method to confirm the customer's logout
  confirmLogout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Logout successful:', response);

        this.showLogoutPopup = false;
        this.router.navigate(['/user-home-page']);
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }
}
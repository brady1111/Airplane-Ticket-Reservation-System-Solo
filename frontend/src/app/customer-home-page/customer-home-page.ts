import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Component({
  imports: [RouterLink],
  selector: 'app-customer-home-page',
  styleUrl: './customer-home-page.css',
  templateUrl: './customer-home-page.html',
})
export class CustomerHomePage {

  constructor(private authService: AuthService, private router: Router) {}

  //controls whether the logout popup is displayed
  showLogoutPopup = signal(false);

  //method to display the logout popup
  openLogoutPopup(): void {
    this.showLogoutPopup.set(true);
  }

  //method to close the logout popup
  closeLogoutPopup(): void {
    this.showLogoutPopup.set(false);
  }

  //method to confirm the customer's logout
  confirmLogout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Logout successful:', response);

        //close the popup
        this.closeLogoutPopup();

        //navigate to the user-home-page
        this.router.navigate(['/user-home-page']);
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }
}
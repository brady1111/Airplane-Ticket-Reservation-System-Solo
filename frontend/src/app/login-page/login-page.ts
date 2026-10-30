import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { LoginValidator } from '../validators/login-validator';
import { AuthService } from '../services/auth.service';

@Component({
  imports: [RouterLink],
  selector: 'app-login-page',
  styleUrl: './login-page.css',
  templateUrl: './login-page.html',
})
export class LoginPage {

  username: string = '';
  password: string = '';
  usernameError: string = '';
  passwordError: string = '';
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  //method to validate the login form
  validateLogin(): boolean {
    this.usernameError = LoginValidator.validateUsername(this.username);
    this.passwordError = LoginValidator.validatePassword(this.password);
    return !this.usernameError && !this.passwordError;
  }

  //method to submit the login form
  submitLogin(event: Event): void {
    event.preventDefault();

    this.errorMessage.set('');

    //check if the login form is valid
    if (!this.validateLogin()) {
      return;
    }

    //send the login credentials to the backend
    this.authService.login(this.username.trim(), this.password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);

        //navigate to the customer home page
        this.router.navigate(['/customer-home-page']);
      },

      //handle the error response from the backend
      error: (error) => {
        console.log('Login error:', error);
        this.errorMessage.set('Invalid username or password.');
      }
    });
  }
}
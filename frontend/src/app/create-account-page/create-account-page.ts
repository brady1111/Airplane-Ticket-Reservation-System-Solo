import { RouterLink } from '@angular/router';
import { Component, signal } from '@angular/core';
import { RegistrationValidator } from '../validators/registration-validator';
import { AuthService } from '../services/auth.service';

@Component({
  imports: [RouterLink],
  selector: 'app-create-account',
  styleUrl: './create-account-page.css',
  templateUrl: './create-account-page.html',
})
export class CreateAccount {
  constructor(private authService: AuthService) {}

  //form fields for creating a new account
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  dateOfBirth: string = '';
  password: string = '';
  confirmPassword: string = '';

  //error messages for form fields
  firstNameError: string = '';
  lastNameError: string = '';
  usernameError: string = '';
  dateOfBirthError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';

  errorMessage = signal('');

  //method to validate the registration form
  validateRegistration(): boolean {
    this.firstNameError = RegistrationValidator.validateFirstName(this.firstName);
    this.lastNameError = RegistrationValidator.validateLastName(this.lastName);
    this.usernameError = RegistrationValidator.validateUsername(this.username);
    this.dateOfBirthError = RegistrationValidator.validateDateOfBirth(this.dateOfBirth);
    this.passwordError = RegistrationValidator.validatePassword(this.password);
    this.confirmPasswordError = RegistrationValidator.validateConfirmPassword(
      this.password, this.confirmPassword
    );

    return !this.firstNameError &&
           !this.lastNameError &&
           !this.usernameError &&
           !this.dateOfBirthError &&
           !this.passwordError &&
           !this.confirmPasswordError;
  }

  //method to submit the registration form
  submitRegistration(event: Event): void {
    //prevent the default form submission behavior
    event.preventDefault();
    this.errorMessage.set('');
    console.log('Registration form submitted');

    //validate the registration form before sending the request
    if (!this.validateRegistration()) {
      return;
    }

    this.authService.createAccount(
      this.username,
      this.password,
      this.firstName,
      this.lastName,
      this.dateOfBirth
    ).subscribe({
      next: (response) => {
        console.log('Account created successfully:', response);
      },
      error: (error) => {
        console.error('Error creating account:', error);
        this.errorMessage.set('Error creating account. Please try again.');
      }
    });
  }
}
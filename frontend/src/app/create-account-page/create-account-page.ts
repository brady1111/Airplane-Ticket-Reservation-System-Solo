
import { RouterLink, Router } from '@angular/router';
import { Component, ChangeDetectorRef } from '@angular/core';
import { RegistrationValidator } from '../validators/registration-validator';
import { AuthService } from '../services/auth.service';

@Component({
  imports: [RouterLink],
  selector: 'app-create-account',
  styleUrl: './create-account-page.css',
  templateUrl: './create-account-page.html',
})
export class CreateAccount {
  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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
  errorMessage: string = '';

  //method to validate the registration form
  validateRegistration(): boolean {
    this.firstNameError = RegistrationValidator.validateFirstName(this.firstName);
    this.lastNameError = RegistrationValidator.validateLastName(this.lastName);
    this.usernameError = RegistrationValidator.validateUsername(this.username);
    this.dateOfBirthError = RegistrationValidator.validateDateOfBirth(this.dateOfBirth);
    this.passwordError = RegistrationValidator.validatePassword(this.password);
    this.confirmPasswordError = RegistrationValidator.validateConfirmPassword(
      this.password,
      this.confirmPassword
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

    console.log('Registration form submitted');

    //clear any previous error messages
    this.firstNameError = '';
    this.lastNameError = '';
    this.usernameError = '';
    this.dateOfBirthError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.errorMessage = '';

    //validate the registration form before sending the request
    if (!this.validateRegistration()) {
      return;
    }

    //send registration data to Django backend
    this.authService.createAccount(
      this.username,
      this.password,
      this.confirmPassword,
      this.firstName,
      this.lastName,
      this.dateOfBirth
    ).subscribe({
      next: (response) => {
        console.log('Account created successfully:', response);

        //clear error messages
        this.errorMessage = '';

        //redirect customer to login page
        this.router.navigate(['/login']);
      },

      error: (error) => {
        console.error('Error creating account:', error);
        console.log('Django validation errors:', error.error);

        //get validation errors returned by Django
        const errors = error.error;

        if (error.status === 400 && errors && typeof errors === 'object') {

          //display each error under its corresponding field
          this.firstNameError = errors.f_name?.join(' ') || '';
          this.lastNameError = errors.l_name?.join(' ') || '';
          this.usernameError = errors.username?.join(' ') || '';
          this.dateOfBirthError = errors.date_of_birth?.join(' ') || '';
          this.passwordError = errors.password?.join(' ') || '';
          this.confirmPasswordError = errors.confirm_password?.join(' ') || '';

          //handle general validation errors
          this.errorMessage = errors.non_field_errors?.join(' ') || '';

          console.log('Username error:', this.usernameError);

        } else {
          //handle server errors or connection problems
          this.errorMessage = 'Unable to create account. Please try again.';
        }

        //notify Angular to update the displayed error messages
        this.cdr.markForCheck();
      }
    });
  }
}

export class RegistrationValidator {
    //method to validate the first name field
    static validateFirstName(firstName: string): string {
        //check if the first name is empty or consists only of whitespace
        if (!firstName.trim()) {
            return 'First name is required';
        }
        return ''; //return an empty string if the first name is valid
    }

    //method to validate the last name field
    static validateLastName(lastName: string): string {
        //check if the last name is empty or consists only of whitespace
        if (!lastName.trim()) {
            return 'Last name is required';
        }
        return ''; //return an empty string if the last name is valid
    }

    //method to validate the username field
    static validateUsername(username: string): string {
        //check if the username is empty or consists only of whitespace
        if (!username.trim()) {
            return 'Username is required';
        }

        if (username.trim().length > 50) {
            return 'Username cannot exceed 50 characters';
        }

        if (username.trim().length < 3) {
            return 'Username must be at least 3 characters long';
        }
        return ''; //return an empty string if the username is valid
    }

    //method to validate the date of birth field
    static validateDateOfBirth(dateOfBirth: string): string {
        //check if the date of birth is empty
        if (!dateOfBirth) {
            return 'Date of birth is required';
        }

        //convert the date of birth to a Date object for comparison
        const birthDate = new Date(dateOfBirth + 'T00:00:00');
        const today = new Date();

        //check if the birth date is valid and not in the future
        if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
            return 'Enter a valid date of birth.';
        }

        //calculate the age based on the birth date and today's date
        let age = today.getFullYear() - birthDate.getFullYear();

        //adjust the age if the birthday hasn't occurred yet this year
        if (
            today.getMonth() < birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate())
        ) {
            age--;
        }

        //check if the user is at least 18 years old
        if (age < 18) {
            return 'You must be at least 18 years old.';
        }

        return ''; //return an empty string if the date of birth is valid
    }

    //method to validate the password field
    static validatePassword(password: string): string {
        //check if the password is empty or consists only of whitespace
        if (!password.trim()) {
            return 'Password is required';
        }

        //check password length
        if (password.trim().length < 8) {
            return 'Password must be at least 8 characters long';
        }

        //check if the password contains at least one uppercase letter, one lowercase letter, one number, and one special character
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/\d/.test(password)) {
            return 'Password must contain at least one number';
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return 'Password must contain at least one special character';
        }

        return ''; //return an empty string if the password is valid
    }

    //method to validate the confirm password field
    static validateConfirmPassword(password: string, confirmPassword: string): string {
        //check if the confirm password field is empty
        if (!confirmPassword) {
            return 'Please confirm your password.';
        }

        //check if the passwords match
        if (password !== confirmPassword) {
            return 'Passwords do not match.';
        }

        return '';
    }

}
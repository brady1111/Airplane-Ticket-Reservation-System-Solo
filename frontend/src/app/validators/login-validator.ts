export class LoginValidator {

    //method to validate the username field in the login form
    static validateUsername(username: string): string {
        //check if the username is empty
        if (!username.trim()) {
            return 'Username is required.';
        }

        //check username length
        if (username.trim().length > 50) {
            return 'Username cannot exceed 50 characters.';
        }

        //return an empty string indicating no errors
        return '';
    }

    //method to validate the password field in the login form
    static validatePassword(password: string): string {
        //check if the password is empty
        if (!password) {
            return 'Password is required.';
        }

        //return an empty string indicating no errors
        return '';
    }
}

import { Injectable } from '@angular/core'; //for creating injectable services in Angular
import { HttpClient } from '@angular/common/http'; //for making HTTP requests to the backend API
import { Observable } from 'rxjs'; //for handling asynchronous operations in Angular

//service for handling authentication-related operations, such as customer login
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //base URL for the backend API
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  //method for handling customer login
  login(username: string, password: string): Observable<any> {
    //send a POST request to the backend API with the customer's username and password
    return this.http.post(`${this.apiUrl}/login/`, {
      username: username, 
      password: password
    }, {
      withCredentials: true //include credentials (cookies) in the request for session management
    });
  }

  //method to check if a customer is logged in
  checkLoginStatus(): Observable<any> {
      //send a GET request to the backend API to check the login status of the customer
      return this.http.get(`${this.apiUrl}/login-status/`, {
      withCredentials: true //include credentials (cookies) in the request for session management
    });
  }

  //method for handling account creation
  createAccount(username: string, password: string, firstName: string, lastName: string, dateOfBirth: string): Observable<any> {
    //send a POST request to the backend API with the customer's account details
    return this.http.post(`${this.apiUrl}/create-account/`, {
      username: username,
      password: password,
      firstName: firstName,
      lastName: lastName,
      dateOfBirth: dateOfBirth
    });
  }

  //method for handling customer logout
  logout(): Observable<any> {
    //send a POST request to the backend API to log out the customer
    return this.http.post(`${this.apiUrl}/logout/`, {}, {
      withCredentials: true //include credentials (cookies) in the request for session management
    });
  }
}
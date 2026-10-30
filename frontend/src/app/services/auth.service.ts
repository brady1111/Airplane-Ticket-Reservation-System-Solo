import { Injectable } from '@angular/core'; //for creating injectable services in Angular
import { HttpClient } from '@angular/common/http'; //for making HTTP requests to the backend API
import { Observable } from 'rxjs'; //for handling asynchronous operations in Angular

//service for handling authentication-related operations, such as customer login
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //base URL for the backend API
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  //method for handling customer login
  login(username: string, password: string): Observable<any> {
    //send a POST request to the backend API with the customer's username and password
    return this.http.post(`${this.apiUrl}/login/`, {
      username: username, 
      password: password
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
}
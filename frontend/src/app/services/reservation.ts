import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private apiUrl = 'http://localhost:8000/api/reservations';

  constructor(private http: HttpClient) {}

  //method to retrieve the logged-in customer's reservations
  getCustomerReservations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-reservations/`, {
      withCredentials: true
    });
  }
}

import { Injectable } from '@angular/core';
import { Flight } from './flights.service';

export interface PendingBooking {
  flight: Flight;
  passengers: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private storageKey = 'pendingBooking';

  //method to save a pending booking to session storage
  savePendingBooking(flight: Flight, passengers: number): void {
    const booking: PendingBooking = {flight: flight, passengers: passengers}; //create a PendingBooking object
    //save the booking object as a JSON string in session storage
    sessionStorage.setItem(this.storageKey, JSON.stringify(booking));
  }

  //method to retrieve a pending booking from session storage
  getPendingBooking(): PendingBooking | null {
    const savedBooking = sessionStorage.getItem(this.storageKey); //retrieve the saved booking from session storage

    //if there is no saved booking, return null
    if (!savedBooking) {
      return null;
    }

    try {
      const booking: PendingBooking = JSON.parse(savedBooking); //parse the saved booking JSON string into a PendingBooking object

      //validate the booking object to ensure it has the required properties
      if (!booking.flight || !booking.flight.offer_id || !Number.isInteger(booking.passengers) || 
          booking.passengers < 1 || booking.passengers > 5) {
        this.clearPendingBooking();
        return null;
      }
      return booking; //return the valid booking object
    } catch {
      this.clearPendingBooking();
      return null;
    }
  }

  //method to clear the pending booking from session storage
  clearPendingBooking(): void {
    sessionStorage.removeItem(this.storageKey);
  }
}
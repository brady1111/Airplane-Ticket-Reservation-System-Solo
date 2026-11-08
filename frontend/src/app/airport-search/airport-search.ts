import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AIRPORTS, Airport } from '../data/airports';

@Component({
  selector: 'app-airport-search',
  imports: [],
   standalone: true,
  templateUrl: './airport-search.html',
  styleUrl: './airport-search.css'
})
export class AirportSearch {

  //label for the airport search field, defaulting to "Airport"
  @Input() label: string = 'Airport';
  @Output() airportSelected = new EventEmitter<string>();

  //state variables for the airport search component
  searchText: string = '';
  selectedAirport: string = '';
  showDropdown: boolean = false;
  filteredAirports: Airport[] = [];

  //filter airports as the customer types
  searchAirports(value: string): void {
    this.searchText = value;
    this.selectedAirport = '';

    //clear the previously selected airport
    this.airportSelected.emit('');

    //if the search field is empty, hide the dropdown and clear the filtered airports
    if (!value.trim()) {
      this.filteredAirports = [];
      this.showDropdown = false;
      return;
    }

    //filter the airports based on the search text, limiting to 8 results
    const search = value.toLowerCase().trim();

    this.filteredAirports = AIRPORTS.filter(airport =>
      airport.code.toLowerCase().includes(search) ||
      airport.city.toLowerCase().includes(search) ||
      airport.name.toLowerCase().includes(search)
    ).slice(0, 8);

    this.showDropdown = true;
  }

  //select an airport from the dropdown
  selectAirport(airport: Airport): void {
    this.selectedAirport = airport.code;
    this.searchText = `${airport.city} (${airport.code})`;

    this.showDropdown = false;

    //send the airport code to the parent page
    this.airportSelected.emit(airport.code);
  }

  //close the dropdown when the field loses focus
  closeDropdown(): void {
    this.showDropdown = false;
  }
}


import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AirportSearch } from './airport-search';

describe('AirportSearch', () => {
  let component: AirportSearch;
  let fixture: ComponentFixture<AirportSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirportSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(AirportSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

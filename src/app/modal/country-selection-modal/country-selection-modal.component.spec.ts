import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountrySelectionModalComponent } from './country-selection-modal.component';

describe('CountrySelectionModalComponent', () => {
  let component: CountrySelectionModalComponent;
  let fixture: ComponentFixture<CountrySelectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CountrySelectionModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CountrySelectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

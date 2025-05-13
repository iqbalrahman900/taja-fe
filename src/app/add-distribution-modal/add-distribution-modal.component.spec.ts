import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDistributionModalComponent } from './add-distribution-modal.component';

describe('AddDistributionModalComponent', () => {
  let component: AddDistributionModalComponent;
  let fixture: ComponentFixture<AddDistributionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddDistributionModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDistributionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

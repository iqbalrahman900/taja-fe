import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddContributorModalComponent } from './add-contributor-modal.component';

describe('AddContributorModalComponent', () => {
  let component: AddContributorModalComponent;
  let fixture: ComponentFixture<AddContributorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddContributorModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddContributorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

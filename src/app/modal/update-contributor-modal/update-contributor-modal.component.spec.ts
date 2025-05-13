import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateContributorModalComponent } from './update-contributor-modal.component';

describe('UpdateContributorModalComponent', () => {
  let component: UpdateContributorModalComponent;
  let fixture: ComponentFixture<UpdateContributorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateContributorModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateContributorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

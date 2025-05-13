import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOriginalPublishingComponent } from './add-original-publishing.component';

describe('AddOriginalPublishingComponent', () => {
  let component: AddOriginalPublishingComponent;
  let fixture: ComponentFixture<AddOriginalPublishingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddOriginalPublishingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOriginalPublishingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateOriginalPublishingComponent } from './update-original-publishing.component';

describe('UpdateOriginalPublishingComponent', () => {
  let component: UpdateOriginalPublishingComponent;
  let fixture: ComponentFixture<UpdateOriginalPublishingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateOriginalPublishingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateOriginalPublishingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

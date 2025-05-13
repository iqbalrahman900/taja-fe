import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OriginalPublishingComponent } from './original-publishing.component';

describe('OriginalPublishingComponent', () => {
  let component: OriginalPublishingComponent;
  let fixture: ComponentFixture<OriginalPublishingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OriginalPublishingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OriginalPublishingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

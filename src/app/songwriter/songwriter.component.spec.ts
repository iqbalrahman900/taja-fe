import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SongwriterComponent } from './songwriter.component';

describe('SongwriterComponent', () => {
  let component: SongwriterComponent;
  let fixture: ComponentFixture<SongwriterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SongwriterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SongwriterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

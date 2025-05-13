import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateSongwriterComponent } from './update-songwriter.component';

describe('UpdateSongwriterComponent', () => {
  let component: UpdateSongwriterComponent;
  let fixture: ComponentFixture<UpdateSongwriterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateSongwriterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateSongwriterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

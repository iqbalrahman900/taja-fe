import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateTaggingSongComponent } from './update-tagging-song.component';

describe('UpdateTaggingSongComponent', () => {
  let component: UpdateTaggingSongComponent;
  let fixture: ComponentFixture<UpdateTaggingSongComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateTaggingSongComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateTaggingSongComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

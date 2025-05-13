import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaggingSongComponent } from './tagging-song.component';

describe('TaggingSongComponent', () => {
  let component: TaggingSongComponent;
  let fixture: ComponentFixture<TaggingSongComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TaggingSongComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaggingSongComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

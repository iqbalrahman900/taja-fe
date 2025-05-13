import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateCatalogModalComponent } from './update-catalog-modal.component';

describe('UpdateCatalogModalComponent', () => {
  let component: UpdateCatalogModalComponent;
  let fixture: ComponentFixture<UpdateCatalogModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateCatalogModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateCatalogModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

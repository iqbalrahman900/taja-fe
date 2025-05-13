import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCatalogModalComponent } from './add-catalog-modal.component';

describe('AddCatalogModalComponent', () => {
  let component: AddCatalogModalComponent;
  let fixture: ComponentFixture<AddCatalogModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCatalogModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCatalogModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

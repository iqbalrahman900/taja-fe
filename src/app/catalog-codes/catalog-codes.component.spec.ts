import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogCodesComponent } from './catalog-codes.component';

describe('CatalogCodesComponent', () => {
  let component: CatalogCodesComponent;
  let fixture: ComponentFixture<CatalogCodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CatalogCodesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CatalogCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

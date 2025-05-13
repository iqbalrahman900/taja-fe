// src/app/add-distribution-modal/add-distribution-modal.component.ts
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { CatalogService, CreateDistributionDto, Catalog } from '../services/catalog.service';

@Component({
  selector: 'app-add-distribution-modal',
  templateUrl: './add-distribution-modal.component.html',
  styleUrls: ['./add-distribution-modal.component.scss']
})
export class AddDistributionModalComponent implements OnInit {
  @ViewChild('content') modalContent!: ElementRef;
  @Output() distributionAdded = new EventEmitter<any>();
  @Input() catalog!: Catalog;
  
  distributionForm!: FormGroup;
  loading = false;
  today = new Date().toISOString().split('T')[0]; // Today's date for min attribute

  constructor(
    private formBuilder: FormBuilder,
    private catalogService: CatalogService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.distributionForm = this.formBuilder.group({
      distributor: ['', Validators.required],
      startDate: [this.today, Validators.required]
    });
  }

  open(): void {
    if (!this.catalog || !this.catalog._id) {
      this.toastr.error('Catalog data is missing', 'Error');
      return;
    }

    this.modalService.open(this.modalContent, {
      backdrop: 'static',
      keyboard: false
    }).result.then(
      (result) => {
        // Modal closed
        this.resetForm();
      },
      (reason) => {
        // Modal dismissed
        this.resetForm();
      }
    );
  }

  resetForm(): void {
    this.initForm();
    this.loading = false;
  }

  onSubmit(): void {
    if (this.distributionForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.distributionForm.controls).forEach(field => {
        const control = this.distributionForm.get(field);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    
    const formData = this.distributionForm.value;
    
    // Prepare the request data
    const distributionData: CreateDistributionDto = {
      catalogId: this.catalog._id,
      tapNumber: this.catalog.tapNumber,
      distributor: formData.distributor,
      startDate: new Date(formData.startDate)
    };

    this.catalogService.addDistribution(distributionData).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastr.success('Distribution added successfully', 'Success');
        this.modalService.dismissAll();
        this.distributionAdded.emit(response);
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error?.message || 'Failed to add distribution', 'Error');
      }
    });
  }
}
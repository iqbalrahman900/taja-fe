// src/app/update-contributor-modal/update-contributor-modal.component.ts
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CatalogService, Contributor, UpdateContributorDto } from '../../services/catalog.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-update-contributor-modal',
  templateUrl: './update-contributor-modal.component.html',
  styleUrls: ['./update-contributor-modal.component.scss']
})
export class UpdateContributorModalComponent implements OnInit {
  @ViewChild('content') modalContent!: ElementRef;
  @Input() contributor!: Contributor;
  @Output() contributorUpdated = new EventEmitter<Contributor>();
  
  contributorForm!: FormGroup;
  loading = false;
  
  // Constants
  readonly TAJA_ARCHIVE = 'TAJA ARCHIVE SDN BHD';

  // Define role types
  roleTypes = [
    { value: 'C', label: 'Composer' },
    { value: 'A', label: 'Author' },
    { value: 'CA', label: 'Composer/Author' },
    { value: 'AR', label: 'Arranger' }
  ];
  
  // Define publisher types
  publisherTypes = [
    { value: 'OP', label: 'Original Publisher' },
    { value: 'SP', label: 'Sub-Publisher' }
  ];
  
  constructor(
    private formBuilder: FormBuilder,
    private catalogService: CatalogService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {}

  initForm(): void {
    this.contributorForm = this.formBuilder.group({
      name: [this.contributor.name, Validators.required],
      role: [this.contributor.role, Validators.required],
      royaltyPercentage: [this.contributor.royaltyPercentage, [Validators.required, Validators.min(0), Validators.max(100)]],
      manager: [this.contributor.manager || ''],
      publisherType: [this.contributor.publisherType || ''],
      publisherName: [this.contributor.publisherName || ''],
      publisherPercentage: [this.contributor.publisherPercentage || null, [Validators.min(0), Validators.max(100)]],
      subPublisherName: [this.contributor.subPublisherName || ''],
      subPublisherPercentage: [this.contributor.subPublisherPercentage || null, [Validators.min(0), Validators.max(100)]]
    });
  }

  // Handler for publisher checkbox
  onPublisherCheckboxChange(event: any): void {
    if (event.target.checked) {
      // Set the publisher name to TAJA ARCHIVE SDN BHD
      this.contributorForm.get('publisherName')?.setValue(this.TAJA_ARCHIVE);
    } else {
      // Only clear if the current value is TAJA ARCHIVE
      if (this.contributorForm.get('publisherName')?.value === this.TAJA_ARCHIVE) {
        this.contributorForm.get('publisherName')?.setValue('');
      }
    }
  }

  // Handler for sub-publisher checkbox
  onSubPublisherCheckboxChange(event: any): void {
    if (event.target.checked) {
      // Set the sub-publisher name to TAJA ARCHIVE SDN BHD
      this.contributorForm.get('subPublisherName')?.setValue(this.TAJA_ARCHIVE);
    } else {
      // Only clear if the current value is TAJA ARCHIVE
      if (this.contributorForm.get('subPublisherName')?.value === this.TAJA_ARCHIVE) {
        this.contributorForm.get('subPublisherName')?.setValue('');
      }
    }
  }

  open(): void {
    // Initialize the form with contributor data
    this.initForm();
    
    this.modalService.open(this.modalContent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    }).result.then(
      () => {}, // Do nothing on close
      () => {}  // Do nothing on dismiss
    );
  }

  onSubmit(): void {
    if (this.contributorForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contributorForm.controls).forEach(key => {
        const control = this.contributorForm.get(key);
        control?.markAsTouched();
      });
      
      this.toastr.error('Please fix the validation errors before submitting', 'Form Invalid');
      return;
    }

    this.loading = true;
    
    try {
      // Get the form values
      const formValues = this.contributorForm.getRawValue();
      
      // Create a properly typed update object
      const updateData: UpdateContributorDto = {};
      
      // Only include non-empty values in the update
      if (formValues.name !== undefined && formValues.name !== null && formValues.name !== '') 
        updateData.name = formValues.name;
        
      if (formValues.role !== undefined && formValues.role !== null && formValues.role !== '') 
        updateData.role = formValues.role;
        
      if (formValues.royaltyPercentage !== undefined && formValues.royaltyPercentage !== null) 
        updateData.royaltyPercentage = formValues.royaltyPercentage;
        
      if (formValues.manager !== undefined && formValues.manager !== null && formValues.manager !== '') 
        updateData.manager = formValues.manager;
        
      if (formValues.publisherType !== undefined && formValues.publisherType !== null && formValues.publisherType !== '') 
        updateData.publisherType = formValues.publisherType;
        
      if (formValues.publisherName !== undefined && formValues.publisherName !== null && formValues.publisherName !== '') 
        updateData.publisherName = formValues.publisherName;
        
      if (formValues.publisherPercentage !== undefined && formValues.publisherPercentage !== null) 
        updateData.publisherPercentage = formValues.publisherPercentage;
        
      if (formValues.subPublisherName !== undefined && formValues.subPublisherName !== null && formValues.subPublisherName !== '') 
        updateData.subPublisherName = formValues.subPublisherName;
        
      if (formValues.subPublisherPercentage !== undefined && formValues.subPublisherPercentage !== null) 
        updateData.subPublisherPercentage = formValues.subPublisherPercentage;
      
      // Send the data to the server
      this.catalogService.updateContributor(this.contributor._id, updateData).subscribe({
        next: (response) => {
          this.loading = false;
          this.toastr.success('Contributor updated successfully', 'Success');
          this.modalService.dismissAll();
          this.contributorUpdated.emit(response);
        },
        error: (err) => {
          this.loading = false;
          console.error('Error updating contributor:', err);
          this.toastr.error(err.error?.message || 'Failed to update contributor', 'Error');
        }
      });
    } catch (error) {
      this.loading = false;
      console.error('Error processing form:', error);
      this.toastr.error('An error occurred while processing the form', 'Error');
    }
  }
}
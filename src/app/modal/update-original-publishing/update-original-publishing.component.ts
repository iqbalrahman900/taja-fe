import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OriginalPublishingService, OriginalPublishing } from '../../services/original-publishing.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-update-original-publishing',
  templateUrl: './update-original-publishing.component.html',
  styleUrls: ['./update-original-publishing.component.scss']
})
export class UpdateOriginalPublishingComponent implements OnInit {
  @Input() publisher!: OriginalPublishing;
  
  publisherForm: FormGroup = this.createForm();
  formSubmitted = false;
  formError = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private publishingService: OriginalPublishingService,
    public activeModal: NgbActiveModal,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Add debug logging to check the publisher data
    console.log('Publisher received:', this.publisher);
    
    this.initializeForm();
    
    // Add debug logging after form initialization
    console.log('Form values after initialization:', this.publisherForm.value);
  }

  createForm(): FormGroup {
    return this.fb.group({
      companyName: ['', [Validators.required]],
      officialEmail: ['', [Validators.required, Validators.email]],
      companyRegistrationNo: ['', [Validators.required]],
      picName: ['', [Validators.required]],
      picTelNo: ['', [Validators.required]],
      picEmail: ['', [Validators.required, Validators.email]],
      picPosition: ['', [Validators.required]]
    });
  }

  initializeForm(): void {
    if (this.publisher) {
      // Explicit debug logging before patching values
      console.log('About to patch form with publisher data');
      
      // Set form values
      this.publisherForm.patchValue({
        companyName: this.publisher.companyName,
        officialEmail: this.publisher.officialEmail,
        companyRegistrationNo: this.publisher.companyRegistrationNo,
        picName: this.publisher.picName,
        picTelNo: this.publisher.picTelNo,
        picEmail: this.publisher.picEmail,
        picPosition: this.publisher.picPosition
      });
      
      // Extra verification after patching
      console.log('Form values after patch:', this.publisherForm.value);
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    if (this.publisherForm.invalid) {
      return;
    }
    
    // Log the form value before submission
    console.log('Form value before submission:', this.publisherForm.value);
    
    this.loading = true;
    this.formError = '';
    
    this.publishingService.updateOriginalPublishing(this.publisher._id, this.publisherForm.value)
      .subscribe({
        next: (publisher) => {
          this.loading = false;
          this.toastr.success(`${publisher.companyName} was successfully updated`, 'Update Successful');
          this.activeModal.close(publisher);
        },
        error: (err) => {
          this.loading = false;
          this.formError = err.error?.message || 'Failed to update publisher. Please try again.';
          this.toastr.error(this.formError, 'Update Failed');
          console.error('Error updating publisher:', err);
        }
      });
  }
}
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  OriginalPublishingService, 
  OriginalPublishing, 
  OriginalPublishingResponse 
} from '../services/original-publishing.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UpdateOriginalPublishingComponent } from '../modal/update-original-publishing/update-original-publishing.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-original-publishing',
  templateUrl: './original-publishing.component.html',
  styleUrls: ['./original-publishing.component.scss']
})
export class OriginalPublishingComponent implements OnInit {
  publishers: OriginalPublishing[] = [];
  totalPublishers = 0;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';
  loading = false;
  expandedRows: boolean[] = [];
  
  // Initialize the form
  publisherForm: FormGroup = this.createForm();
  formSubmitted = false;
  formError = '';
  showContractForm = false;

  constructor(
    private publishingService: OriginalPublishingService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadPublishers();
  }

  createForm(): FormGroup {
    return this.fb.group({
      companyName: ['', [Validators.required]],
      officialEmail: ['', [Validators.required, Validators.email]],
      companyRegistrationNo: ['', [Validators.required]],
      tinNumber: ['', [Validators.required]],
      address: ['', [Validators.required]],
      picName: ['', [Validators.required]],
      picTelNo: ['', [Validators.required]],
      picEmail: ['', [Validators.required, Validators.email]],
      picPosition: ['', [Validators.required]],
      deal: [''],
      contract: this.fb.group({
        type: ['', [Validators.required]],
        startDate: ['', [Validators.required]],
        endDate: [''],
        isActive: [true],
        terms: ['']
      })
    });
  }

  toggleContractForm(): void {
    this.showContractForm = !this.showContractForm;
  }

  // Rest of the methods remain the same
  toggleDetailView(index: number): void {
    // Initialize the array with false values if it doesn't have enough entries
    while (this.expandedRows.length <= index) {
      this.expandedRows.push(false);
    }
    
    // Toggle the expanded state for the clicked row
    this.expandedRows[index] = !this.expandedRows[index];
  }

  loadPublishers(): void {
    this.loading = true;
    this.publishingService.getOriginalPublishings(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response: OriginalPublishingResponse) => {
          this.publishers = response.data;
          this.totalPublishers = response.total;
          
          // Reset the expanded rows array
          this.expandedRows = new Array(this.publishers.length).fill(false);
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading publishers:', err);
          this.loading = false;
          this.toastr.error('Failed to load publishers. Please try again.', 'Error');
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPublishers();
  }

  onSearch(): void {
    this.currentPage = 1; // Reset to first page
    this.loadPublishers();
  }

  resetForm(): void {
    // Reset the form when opening the modal
    this.publisherForm = this.createForm();
    this.formSubmitted = false;
    this.formError = '';
    this.showContractForm = false;
  }

  openAddModal(content: any): void {
    this.resetForm();
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  }

  openUpdateModal(publisher: OriginalPublishing): void {
    const modalRef = this.modalService.open(UpdateOriginalPublishingComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.publisher = publisher;
    
    // When modal is closed with success
    modalRef.closed.subscribe(result => {
      if (result) {
        this.loadPublishers(); // Refresh the list after update
      }
    });
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    if (this.publisherForm.invalid) {
      return;
    }
    
    // If contract form is not shown, remove the contract data before submission
    if (!this.showContractForm) {
      const formValue = this.publisherForm.value;
      delete formValue.contract;
      this.publisherForm.setValue(formValue);
    }
    
    this.loading = true;
    this.formError = '';
    
    this.publishingService.createOriginalPublishing(this.publisherForm.value)
      .subscribe({
        next: (publisher) => {
          this.loading = false;
          this.toastr.success(`${publisher.companyName} was successfully added`, 'Publisher Created');
          this.modalService.dismissAll();
          this.loadPublishers(); // Refresh the list
        },
        error: (err) => {
          this.loading = false;
          this.formError = err.error?.message || 'Failed to create publisher. Please try again.';
          this.toastr.error(this.formError, 'Creation Failed');
          console.error('Error creating publisher:', err);
        }
      });
  }

  confirmDelete(publisher: OriginalPublishing): void {
    if (confirm(`Are you sure you want to delete ${publisher.companyName}?`)) {
      this.loading = true;
      this.publishingService.deleteOriginalPublishing(publisher._id)
        .subscribe({
          next: () => {
            this.loading = false;
            this.toastr.success(`${publisher.companyName} was successfully deleted`, 'Publisher Deleted');
            this.loadPublishers(); // Refresh the list
          },
          error: (err) => {
            this.loading = false;
            console.error('Error deleting publisher:', err);
            this.toastr.error('Failed to delete publisher. Please try again.', 'Deletion Failed');
          }
        });
    }
  }
}
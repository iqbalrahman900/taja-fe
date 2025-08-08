// src/app/songwriter/update-songwriter/update-songwriter.component.ts
import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SongwriterService, Songwriter } from '../../services/songwriter.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-update-songwriter',
  templateUrl: './update-songwriter.component.html',
  styleUrls: ['./update-songwriter.component.scss']
})
export class UpdateSongwriterComponent implements OnInit {
  @Input() songwriter!: Songwriter;
  
  songwriterForm: FormGroup = this.createForm();
  formSubmitted = false;
  formError = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private songwriterService: SongwriterService,
    public activeModal: NgbActiveModal,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Add debug logging to check the songwriter data
    console.log('Songwriter received:', this.songwriter);
    console.log('IC Number value:', this.songwriter.icNumber);
    console.log('MACP value:', this.songwriter.macp);
    
    this.initializeForm();
    
    // Add debug logging after form initialization
    console.log('Form values after initialization:', this.songwriterForm.value);
    console.log('IC Number in form:', this.songwriterForm.get('icNumber')?.value);
    console.log('MACP in form:', this.songwriterForm.get('macp')?.value);
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      contactNumber: ['', [Validators.required]],
      icNumber: [''],
      tinNumber: [''],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      dateOfBirth: ['', [Validators.required]],
      macp: [false], // MACP checkbox field
      penNames: this.fb.array([]),
      contract: this.fb.group({
        type: ['', Validators.required],
        startDate: ['', Validators.required],
        endDate: [''],
        terms: ['']
      }),
      deal: [''],
      heir: this.fb.group({
        name: ['', Validators.required],
        contactNumber: ['', Validators.required],
        relationship: ['', Validators.required]
      })
    });
  }

  initializeForm(): void {
    if (this.songwriter) {
      // Format date to YYYY-MM-DD for date inputs
      const dob = this.songwriter.dateOfBirth instanceof Date 
        ? this.songwriter.dateOfBirth.toISOString().split('T')[0]
        : typeof this.songwriter.dateOfBirth === 'string' 
          ? new Date(this.songwriter.dateOfBirth).toISOString().split('T')[0]
          : '';

      let startDate = '';
      let endDate = '';
      
      if (this.songwriter.contract) {
        startDate = this.songwriter.contract.startDate instanceof Date 
          ? this.songwriter.contract.startDate.toISOString().split('T')[0]
          : typeof this.songwriter.contract.startDate === 'string' 
            ? new Date(this.songwriter.contract.startDate).toISOString().split('T')[0]
            : '';
            
        endDate = this.songwriter.contract.endDate instanceof Date 
          ? this.songwriter.contract.endDate.toISOString().split('T')[0]
          : typeof this.songwriter.contract.endDate === 'string' && this.songwriter.contract.endDate
            ? new Date(this.songwriter.contract.endDate).toISOString().split('T')[0]
            : '';
      }

      // Clear the existing penNames FormArray and add songwriters's pen names
      this.clearPenNamesArray();
      if (this.songwriter.penNames && this.songwriter.penNames.length > 0) {
        this.songwriter.penNames.forEach(penName => {
          this.addPenName(penName.name, penName.isActive);
        });
      } else {
        this.addPenName('', true);
      }

      // Explicit debug logging before patching values
      console.log('About to patch form with icNumber:', this.songwriter.icNumber);
      console.log('About to patch form with MACP:', this.songwriter.macp);
      
      // Set form values
      this.songwriterForm.patchValue({
        name: this.songwriter.name,
        contactNumber: this.songwriter.contactNumber,
        icNumber: this.songwriter.icNumber || '',
        tinNumber: this.songwriter.tinNumber || '',
        email: this.songwriter.email,
        address: this.songwriter.address || '',
        dateOfBirth: dob,
        macp: this.songwriter.macp || false, // MACP field initialization
        contract: {
          type: this.songwriter.contract?.type || '',
          startDate: startDate,
          endDate: endDate,
          terms: this.songwriter.contract?.terms || ''
        },
        deal: this.songwriter.deal || '',
        heir: {
          name: this.songwriter.heir?.name || '',
          contactNumber: this.songwriter.heir?.contactNumber || '',
          relationship: this.songwriter.heir?.relationship || ''
        }
      });
      
      // Extra verification after patching
      console.log('Form values after patch:', this.songwriterForm.value);
      console.log('IC Number after patch:', this.songwriterForm.get('icNumber')?.value);
      console.log('MACP after patch:', this.songwriterForm.get('macp')?.value);
    }
  }

  createPenNameGroup(name: string = '', isActive: boolean = true): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      isActive: [isActive]
    });
  }

  get penNames(): FormArray {
    return this.songwriterForm.get('penNames') as FormArray;
  }

  clearPenNamesArray(): void {
    while (this.penNames.length !== 0) {
      this.penNames.removeAt(0);
    }
  }

  addPenName(name: string = '', isActive: boolean = true): void {
    this.penNames.push(this.createPenNameGroup(name, isActive));
  }

  removePenName(index: number): void {
    this.penNames.removeAt(index);
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    if (this.songwriterForm.invalid) {
      return;
    }
    
    // Log the form value before submission
    console.log('Form value before submission:', this.songwriterForm.value);
    console.log('MACP value being submitted:', this.songwriterForm.get('macp')?.value);
    
    this.loading = true;
    this.formError = '';
    
    this.songwriterService.updateSongwriter(this.songwriter._id, this.songwriterForm.value)
      .subscribe({
        next: (songwriter) => {
          this.loading = false;
          this.toastr.success(`${songwriter.name} was successfully updated`, 'Update Successful');
          this.activeModal.close(songwriter);
        },
        error: (err) => {
          this.loading = false;
          this.formError = err.error?.message || 'Failed to update songwriter. Please try again.';
          this.toastr.error(this.formError, 'Update Failed');
          console.error('Error updating songwriter:', err);
        }
      });
  }
}
// src/app/add-contributor-modal/add-contributor-modal.component.ts
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { CatalogService, CreateContributorDto, Catalog } from '../services/catalog.service';
import { SongwriterService, Songwriter, PenName } from '../services/songwriter.service';

@Component({
  selector: 'app-add-contributor-modal',
  templateUrl: './add-contributor-modal.component.html',
  styleUrls: ['./add-contributor-modal.component.scss']
})
export class AddContributorModalComponent implements OnInit {
  @ViewChild('content') modalContent!: ElementRef;
  @Output() contributorAdded = new EventEmitter<any>();
  @Input() catalog!: Catalog;

  readonly TAJA_ARCHIVE = 'TAJA ARCHIVE SDN BHD';
  
  contributorForm!: FormGroup;
  loading = false;
  songwriters: Songwriter[] = [];
  availablePenNames: PenName[] = [];
  isTajaContributor = false; // Toggle for TAJA vs regular contributor
  
  roleTypes = [
    { value: 'C', label: 'Composer' },
    { value: 'A', label: 'Author' },
    { value: 'CA', label: 'Composer/Author' },
    { value: 'AR', label: 'Arranger' }
  ];
  
  publisherTypes = [
    { value: 'OP', label: 'Original Publisher' },
    { value: 'SP', label: 'Sub-Publisher' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private catalogService: CatalogService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private songwriterService: SongwriterService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadSongwriters();
  }

  loadSongwriters(): void {
    this.loading = true;
    this.songwriterService.getSongwriters(1, 1000).subscribe({
      next: (response) => {
        this.songwriters = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load songwriters', 'Error');
        this.loading = false;
      }
    });
  }

  initForm(): void {
    this.contributorForm = this.formBuilder.group({
      name: ['', Validators.required],
      selectedSongwriter: [''],
      selectedPenName: [''],
      role: ['C', Validators.required],
      royaltyPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      manager: [''],
      publisherType: ['OP'],
      publisherName: [''],
      publisherPercentage: [0, [Validators.min(0), Validators.max(100)]],
      subPublisherName: [''],
      subPublisherPercentage: [0, [Validators.min(0), Validators.max(100)]]
    });

    // Listen for changes on the songwriter dropdown
    this.contributorForm.get('selectedSongwriter')?.valueChanges.subscribe(value => {
      if (value) {
        const selectedSongwriter = this.songwriters.find(s => s._id === value);
        if (selectedSongwriter) {
          // Update name field with songwriter's name
          this.contributorForm.patchValue({
            name: selectedSongwriter.name,
            selectedPenName: '' // Reset pen name selection
          });
          
          // Update available pen names
          this.availablePenNames = selectedSongwriter.penNames || [];
        }
      } else {
        // Clear pen names if no songwriter selected
        this.availablePenNames = [];
        this.contributorForm.patchValue({
          selectedPenName: ''
        });
      }
    });

    // Listen for changes on the pen name dropdown
    this.contributorForm.get('selectedPenName')?.valueChanges.subscribe(value => {
      if (value) {
        const selectedPenName = this.availablePenNames.find(p => p._id === value);
        if (selectedPenName) {
          // Update name field with pen name
          this.contributorForm.patchValue({
            name: selectedPenName.name
          });
        }
      } else if (this.contributorForm.get('selectedSongwriter')?.value) {
        // If pen name is cleared but songwriter is still selected, revert to songwriter name
        const selectedSongwriter = this.songwriters.find(s => s._id === this.contributorForm.get('selectedSongwriter')?.value);
        if (selectedSongwriter) {
          this.contributorForm.patchValue({
            name: selectedSongwriter.name
          });
        }
      }
    });
  }

  // Handler for contributor type toggle
  onContributorTypeChange(): void {
    if (!this.isTajaContributor) {
      // Switching to regular contributor - clear songwriter/pen name selections
      this.contributorForm.patchValue({
        selectedSongwriter: '',
        selectedPenName: '',
        name: ''
      });
      this.availablePenNames = [];
    } else {
      // Switching to TAJA contributor - enable songwriter dropdown
      this.contributorForm.patchValue({
        name: ''
      });
    }
  }

  onPublisherCheckboxChange(event: any): void {
    if (event.target.checked) {
      this.contributorForm.get('publisherName')?.setValue(this.TAJA_ARCHIVE);
    } else {
      if (this.contributorForm.get('publisherName')?.value === this.TAJA_ARCHIVE) {
        this.contributorForm.get('publisherName')?.setValue('');
      }
    }
  }
  
  onSubPublisherCheckboxChange(event: any): void {
    if (event.target.checked) {
      this.contributorForm.get('subPublisherName')?.setValue(this.TAJA_ARCHIVE);
    } else {
      if (this.contributorForm.get('subPublisherName')?.value === this.TAJA_ARCHIVE) {
        this.contributorForm.get('subPublisherName')?.setValue('');
      }
    }
  }

  open(): void {
    if (!this.catalog || !this.catalog._id) {
      this.toastr.error('Catalog data is missing', 'Error');
      return;
    }

    this.modalService.open(this.modalContent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    }).result.then(
      (result) => {
        this.resetForm();
      },
      (reason) => {
        this.resetForm();
      }
    );
  }

  resetForm(): void {
    this.initForm();
    this.availablePenNames = [];
    this.isTajaContributor = false;
    this.loading = false;
  }

  onSubmit(): void {
    if (this.contributorForm.invalid) {
      Object.keys(this.contributorForm.controls).forEach(field => {
        const control = this.contributorForm.get(field);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    
    const formData = { ...this.contributorForm.value };
    
    // Remove the selection fields not needed in the API call
    delete formData.selectedSongwriter;
    delete formData.selectedPenName;
    
    const contributorData: CreateContributorDto = {
      catalogId: this.catalog._id,
      tapNumber: this.catalog.tapNumber,
      ...formData
    };
    
    // Remove empty fields
    Object.keys(contributorData).forEach(key => {
      const typedKey = key as keyof CreateContributorDto;
      const value = contributorData[typedKey];
      if (value === '' || value === null) {
        delete (contributorData as any)[key];
      }
    });

    this.catalogService.addContributor(contributorData).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastr.success('Contributor added successfully', 'Success');
        this.modalService.dismissAll();
        this.contributorAdded.emit(response);
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error?.message || 'Failed to add contributor', 'Error');
      }
    });
  }
}
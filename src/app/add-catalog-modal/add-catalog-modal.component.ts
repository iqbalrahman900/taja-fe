// src/app/add-catalog-modal/add-catalog-modal.component.ts

import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CatalogService, CreateCatalogDto, CatalogStatus } from '../services/catalog.service';
import { TaggingSongService, TaggingSong } from '../services/tagging-songs.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CountrySelectionModalComponent } from '../modal/country-selection-modal/country-selection-modal.component';

// Define the enums to match the backend
enum SongType {
  COMMERCIAL = 'commercial',
  JINGLES = 'jingles',
  SCORING = 'scoring',
  MONTAGE = 'montage',
}

enum CatalogType {
  ORIGINAL = 'original',
  ADAPTATION = 'adaptation',
}

enum VersionType {
  REMIX = 'remix',
  COVER = 'cover',
}

@Component({
  selector: 'app-add-catalog-modal',
  templateUrl: './add-catalog-modal.component.html',
  styleUrls: ['./add-catalog-modal.component.scss'],
  animations: [
    trigger('fadeIn', [
      state('true', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      state('false', style({
        opacity: 0,
        transform: 'translateY(-10px)'
      })),
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(-10px)'
        }),
        animate('0.3s ease-out', style({
          opacity: 1,
          transform: 'translateY(0)'
        }))
      ]),
      transition(':leave', [
        animate('0.3s ease-out', style({
          opacity: 0,
          transform: 'translateY(-10px)'
        }))
      ])
    ])
  ]
})
export class AddCatalogModalComponent implements OnInit {
  @ViewChild('content') modalContent!: ElementRef;
  @ViewChild('countrySelector') countrySelector!: CountrySelectionModalComponent;
  @Output() catalogAdded = new EventEmitter<any>();
  
  catalogForm!: FormGroup;
  loading = false;
  tagsLoading = false;
  catalogTypes = Object.values(CatalogType); // ['original', 'adaptation']
  versionTypes = Object.values(VersionType); // ['remix', 'cover']
  songTypes = Object.values(SongType); // ['commercial', 'jingles', 'scoring', 'montage']
  availableTags: TaggingSong[] = [];
  
  // YouTube URL pattern for validation
  ytUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  
  // Add this property for alternate title toggle
  hasAlternateTitle = false;
  
  // Country selection properties
  selectedCountryNames: string[] = [];
  
  constructor(
    private formBuilder: FormBuilder,
    private catalogService: CatalogService,
    private taggingSongService: TaggingSongService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadTaggings();
  }

  // Getter for easier access to the IPI codes form array
  get ipiCodesArray(): FormArray {
    return this.catalogForm.get('ipiCodes') as FormArray;
  }

  // Add a new IPI code input field
  addIpiCode(): void {
    this.ipiCodesArray.push(this.formBuilder.control(''));
  }

  // Remove an IPI code input field
  removeIpiCode(index: number): void {
    this.ipiCodesArray.removeAt(index);
  }

  initForm(): void {
    this.catalogForm = this.formBuilder.group({
      title: ['', Validators.required],
      alternateTitle: [''],
      type: [CatalogType.ORIGINAL, Validators.required],
      versionType: [''],
      genre: [''],
      performer: [''],
      remarks: [''],
      invCode: [''],
      ipiCodes: this.formBuilder.array([this.formBuilder.control('')]),
      iswcCode: [''],
      isrcCode: [''],
      tagging: [''],
      youtubeLink: ['', Validators.pattern(this.ytUrlPattern)],
      songType: [SongType.COMMERCIAL],
      dateIn: [new Date().toISOString().split('T')[0]],
      dateOut: [''],
      parentTapNumber: [''],
      countrycover: [0] // Initialize with 0 countries selected
    });
    
    // Monitor type changes to update validation
    this.catalogForm.get('type')?.valueChanges.subscribe(value => {
      this.updateValidationForType(value);
    });
    
    // Listen for changes to alternate title to update toggle state
    this.catalogForm.get('alternateTitle')?.valueChanges.subscribe(value => {
      if (value && value.trim() !== '') {
        this.hasAlternateTitle = true;
      }
    });
    
    // Set initial state for hasAlternateTitle
    const initialAlternateTitle = this.catalogForm.get('alternateTitle')?.value;
    this.hasAlternateTitle = initialAlternateTitle && initialAlternateTitle.length > 0;
    
    // Initialize country selection
    this.selectedCountryNames = [];
    this.updateCountryCoverCount();
  }

  // Add method to toggle alternate title
  toggleAlternateTitle(): void {
    this.hasAlternateTitle = !this.hasAlternateTitle;
    
    if (!this.hasAlternateTitle) {
      // Clear the alternate title when toggle is unchecked
      this.catalogForm.get('alternateTitle')?.setValue('');
    }
  }

  // Check if parent TAP number field should be shown
  showParentTapNumber(): boolean {
    const versionType = this.catalogForm.get('versionType')?.value;
    return versionType === 'remix' || versionType === 'cover';
  }

  // Handle version type changes
  onVersionTypeChange(): void {
    const versionType = this.catalogForm.get('versionType')?.value;
    
    if (versionType === 'remix' || versionType === 'cover') {
      // Make parent TAP number required for remix/cover
      this.catalogForm.get('parentTapNumber')?.setValidators([Validators.required]);
    } else {
      // Clear parent TAP number and make it not required
      this.catalogForm.get('parentTapNumber')?.clearValidators();
      this.catalogForm.get('parentTapNumber')?.setValue('');
    }
    
    this.catalogForm.get('parentTapNumber')?.updateValueAndValidity();
  }
  
  // Update validation based on type selection
  updateValidationForType(type: CatalogType): void {
    const versionTypeControl = this.catalogForm.get('versionType');
    const parentTapNumberControl = this.catalogForm.get('parentTapNumber');
    
    if (type === CatalogType.ADAPTATION) {
      // versionTypeControl?.setValidators([Validators.required]);
      // parentTapNumberControl?.setValidators([Validators.required]);
    } else {
      versionTypeControl?.clearValidators();
      versionTypeControl?.setValue(null);
      parentTapNumberControl?.clearValidators();
      parentTapNumberControl?.setValue('');
    }
    
    versionTypeControl?.updateValueAndValidity();
    parentTapNumberControl?.updateValueAndValidity();
  }
  
  // Method to check if version type field should be shown
  showVersionType(): boolean {
    return this.catalogForm.get('type')?.value === CatalogType.ADAPTATION;
  }
  
  // Handler for type selection changes
  onTypeChange(): void {
    const type = this.catalogForm.get('type')?.value;
    
    if (type === CatalogType.ORIGINAL) {
      // Clear version type and parent TAP number for original works
      this.catalogForm.patchValue({
        versionType: null,
        parentTapNumber: ''
      });
    }
  }

  onSongTypeChange(): void {
    const songType = this.catalogForm.get('songType')?.value;
    
    // Set defaults based on song type
    if (songType !== SongType.COMMERCIAL) {
      // For non-commercial songs, force type to original
      this.catalogForm.patchValue({ type: CatalogType.ORIGINAL });
    }
  }

  showCatalogType(): boolean {
    const songType = this.catalogForm.get('songType')?.value;
    // Only show catalog type for commercial song type
    return songType === SongType.COMMERCIAL;
  }

  loadTaggings(): void {
    this.tagsLoading = true;
    this.taggingSongService.getActiveTaggingSongs()
      .pipe(finalize(() => this.tagsLoading = false))
      .subscribe({
        next: (tags) => {
          this.availableTags = tags;
        },
        error: (error) => {
          this.toastr.error('Failed to load tagging options', 'Error');
          console.error('Error loading taggings:', error);
        }
      });
  }

  // Country selection methods
  openCountrySelector(): void {
    this.countrySelector.open();
  }

  onCountriesSelected(countries: string[]): void {
    this.selectedCountryNames = countries;
    this.updateCountryCoverCount();
  }

  updateCountryCoverCount(): void {
    this.catalogForm.patchValue({
      countrycover: this.selectedCountryNames.length
    });
  }

  open(): void {
    // Ensure the latest taggings are loaded when the modal is opened
    this.loadTaggings();
    
    this.modalService.open(this.modalContent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    }).result.then(
      () => this.resetForm(),
      () => this.resetForm()
    );
  }

  resetForm(): void {
    this.initForm();
    this.loading = false;
    this.hasAlternateTitle = false; // Reset toggle state
    this.selectedCountryNames = []; // Reset country selection
  }

  onSubmit(): void {
    if (this.catalogForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.catalogForm.controls).forEach(key => {
        const control = this.catalogForm.get(key);
        control?.markAsTouched();
      });
      
      this.toastr.error('Please fix the validation errors before submitting', 'Form Invalid');
      return;
    }
  
    this.loading = true;
    
    try {
      // Get a complete copy of the form values
      const formData = { ...this.catalogForm.getRawValue() };
      
      // Process the IPI codes from the FormArray
      const ipiCodes = formData.ipiCodes
        .filter((code: string) => code && code.trim() !== '')
        .map((code: string) => code.trim());
      
      // Create the API request object
      const apiRequest: any = { ...formData };
      
      // Set ipiCode field for the API (matching the backend field name)
      apiRequest.ipiCode = ipiCodes;
      
      // Remove the original FormArray property
      delete apiRequest.ipiCodes;
      
      // REMOVED the conditional check that was removing versionType and parentTapNumber
      // Now they will be included in the request regardless of the type value
      
      // Country cover is already a number, but need to keep the country names for internal use
      apiRequest.selectedCountries = this.selectedCountryNames; // You might want to save this too
      
      // Remove empty string values
      Object.keys(apiRequest).forEach(key => {
        if (apiRequest[key] === '' || apiRequest[key] === null) {
          delete apiRequest[key];
        }
      });
      
      // Debug logging
      console.log('Submitting catalog:', apiRequest);
      
      // Send the data to the server
      this.catalogService.createCatalog(apiRequest).subscribe({
        next: (response) => {
          this.loading = false;
          this.toastr.success('Catalog added successfully with status: PENDING', 'Success');
          this.modalService.dismissAll();
          this.catalogAdded.emit(response);
        },
        error: (err) => {
          this.loading = false;
          console.error('Error creating catalog:', err);
          this.toastr.error(err.error?.message || 'Failed to add catalog', 'Error');
        }
      });
    } catch (error) {
      this.loading = false;
      console.error('Error processing form:', error);
      this.toastr.error('An error occurred while processing the form', 'Error');
    }
  }
}
// src/app/modal/update-catalog-modal/update-catalog-modal.component.ts
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CatalogService, Catalog, CatalogStatus, SongType, VersionType } from '../../services/catalog.service';
import { TaggingSongService, TaggingSong } from '../../services/tagging-songs.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';
import { CountrySelectionModalComponent } from '../country-selection-modal/country-selection-modal.component';

enum CatalogType {
  ORIGINAL = 'original',
  ADAPTATION = 'adaptation',
}

@Component({
  selector: 'app-update-catalog-modal',
  templateUrl: './update-catalog-modal.component.html',
  styleUrls: ['./update-catalog-modal.component.scss']
})
export class UpdateCatalogModalComponent implements OnInit {
  @ViewChild('content') modalContent!: ElementRef;
  @ViewChild('countrySelector') countrySelector!: CountrySelectionModalComponent;
  @Input() catalog!: Catalog;
  @Output() catalogUpdated = new EventEmitter<Catalog>();
  
  catalogForm!: FormGroup;
  loading = false;
  tagsLoading = false;
  catalogTypes = Object.values(CatalogType);
  versionTypes = Object.values(VersionType);
  songTypes = Object.values(SongType);
  catalogStatuses = Object.values(CatalogStatus);
  availableTags: TaggingSong[] = [];
  
  // YouTube URL pattern for validation
  ytUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  
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
    // Convert ipiCode array to FormArray
    const ipiCodesArray = this.formBuilder.array([]);
    
    if (this.catalog.ipiCode && this.catalog.ipiCode.length > 0) {
      // Add each IPI code to the FormArray
      this.catalog.ipiCode.forEach(code => {
        ipiCodesArray.push(this.formBuilder.control(code));
      });
    } else {
      // Add an empty field if no IPI codes exist
      ipiCodesArray.push(this.formBuilder.control(''));
    }
    
    // Initialize selected countries from catalog data
    if (this.catalog.selectedCountries) {
      if (typeof this.catalog.selectedCountries === 'string') {
        // Try to parse if it's a string representation of an array
        try {
          this.selectedCountryNames = JSON.parse(this.catalog.selectedCountries);
        } catch {
          this.selectedCountryNames = [];
        }
      } else if (Array.isArray(this.catalog.selectedCountries)) {
        this.selectedCountryNames = [...this.catalog.selectedCountries];
      }
    } else {
      this.selectedCountryNames = [];
    }
    
    this.catalogForm = this.formBuilder.group({
      title: [this.catalog.title, Validators.required],
      alternateTitle: [this.catalog.alternateTitle || ''],
      type: [this.catalog.type],
      versionType: [this.catalog.versionType || ''],
      genre: [this.catalog.genre || ''],
      performer: [this.catalog.performer || ''],
      remarks: [this.catalog.remarks || ''],
      invCode: [this.catalog.invCode || ''],
      ipiCodes: ipiCodesArray,
      iswcCode: [this.catalog.iswcCode || ''],
      isrcCode: [this.catalog.isrcCode || ''],
      tagging: [this.catalog.tagging || ''],
      youtubeLink: [this.catalog.youtubeLink || '', Validators.pattern(this.ytUrlPattern)],
      songType: [this.catalog.songType || SongType.COMMERCIAL],
      status: [this.catalog.status || CatalogStatus.PENDING],
      dateIn: [this.catalog.dateIn ? new Date(this.catalog.dateIn).toISOString().split('T')[0] : ''],
      dateOut: [this.catalog.dateOut ? new Date(this.catalog.dateOut).toISOString().split('T')[0] : ''],
      parentTapNumber: [this.catalog.parentTapNumber || ''],
      countrycover: [this.catalog.countrycover || this.selectedCountryNames.length || 0]
    });
    
    // Add listeners for form changes
    this.catalogForm.get('songType')?.valueChanges.subscribe(() => {
      this.onSongTypeChange();
    });
    
    this.catalogForm.get('type')?.valueChanges.subscribe(() => {
      this.onTypeChange();
    });
    
    this.catalogForm.get('versionType')?.valueChanges.subscribe(() => {
      this.onVersionTypeChange();
    });
    
    this.catalogForm.get('status')?.valueChanges.subscribe(() => {
      this.onStatusChange();
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

  // Check if catalog type field should be shown
  showCatalogType(): boolean {
    const songType = this.catalogForm.get('songType')?.value;
    return songType === SongType.COMMERCIAL;
  }

  // Check if version type field should be shown
  showVersionType(): boolean {
    const type = this.catalogForm.get('type')?.value;
    return type === CatalogType.ADAPTATION;
  }

  // Check if parent TAP number field should be shown
  showParentTapNumber(): boolean {
    const versionType = this.catalogForm.get('versionType')?.value;
    return versionType === 'remix' || versionType === 'cover';
  }

  // Handle status changes
  onStatusChange(): void {
    const status = this.catalogForm.get('status')?.value;
    
    if (status === CatalogStatus.INACTIVE) {
      // Set dateOut to today if it's not already set
      if (!this.catalogForm.get('dateOut')?.value) {
        const today = new Date().toISOString().split('T')[0];
        this.catalogForm.get('dateOut')?.setValue(today);
      }
    } else {
      // Clear dateOut field for other statuses
      this.catalogForm.get('dateOut')?.setValue('');
    }
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
    }
    
    this.catalogForm.get('parentTapNumber')?.updateValueAndValidity();
  }
  
  // Handle type changes
  onTypeChange(): void {
    const type = this.catalogForm.get('type')?.value;
    
    if (type === CatalogType.ORIGINAL) {
      // Clear version type and parent TAP number for original works
      this.catalogForm.patchValue({
        versionType: '',
        parentTapNumber: ''
      });
    }
  }

  // Handle song type changes
  onSongTypeChange(): void {
    const songType = this.catalogForm.get('songType')?.value;
    
    // Set defaults based on song type
    if (songType !== SongType.COMMERCIAL) {
      // For non-commercial songs, force type to original
      this.catalogForm.patchValue({ type: CatalogType.ORIGINAL });
    }
  }

  // Helper method to get badge class for status
  getStatusBadgeClass(status: CatalogStatus): string {
    switch (status) {
      case CatalogStatus.PENDING:
        return 'bg-warning';
      case CatalogStatus.ACTIVE:
        return 'bg-success';
      case CatalogStatus.INACTIVE:
        return 'bg-secondary';
      case CatalogStatus.CONFLICT:
        return 'bg-danger';
      default:
        return 'bg-light';
    }
  }

  // Load tagging options
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

  // Open the modal
  open(): void {
    // Initialize the form with catalog data
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

  // Submit the form
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
      
      // Add selected countries data
      apiRequest.selectedCountries = this.selectedCountryNames;
      
      // Remove empty string values
      Object.keys(apiRequest).forEach(key => {
        if (apiRequest[key] === '' || apiRequest[key] === null) {
          delete apiRequest[key];
        }
      });
      
      // Debug logging
      console.log('Updating catalog:', apiRequest);
      
      // Send the data to the server
      this.catalogService.updateCatalog(this.catalog._id, apiRequest).subscribe({
        next: (response) => {
          this.loading = false;
          this.toastr.success('Catalog updated successfully', 'Success');
          this.modalService.dismissAll();
          this.catalogUpdated.emit(response);
        },
        error: (err) => {
          this.loading = false;
          console.error('Error updating catalog:', err);
          this.toastr.error(err.error?.message || 'Failed to update catalog', 'Error');
        }
      });
    } catch (error) {
      this.loading = false;
      console.error('Error processing form:', error);
      this.toastr.error('An error occurred while processing the form', 'Error');
    }
  }
}
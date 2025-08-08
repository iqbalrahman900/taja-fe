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
  
  // Autocomplete properties
  filteredSongwriters: Songwriter[] = [];
  showSongwriterSuggestions = false;
  highlightedSongwriterIndex = -1;
  selectedSongwriterId: string = ''; // Store the selected songwriter's ID
  
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

  // Get reference to the input field
  get songwriterInput() {
    return this.contributorForm.get('songwriterInput');
  }

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
        this.filteredSongwriters = [...this.songwriters]; // Initialize filtered list
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
      songwriterInput: [''], // New input field for autocomplete
      selectedSongwriter: [''], // Keep this for internal tracking
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

    // Initialize filtered songwriters
    this.filteredSongwriters = [...this.songwriters];

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
      } else if (this.selectedSongwriterId) {
        // If pen name is cleared but songwriter is still selected, revert to songwriter name
        const selectedSongwriter = this.songwriters.find(s => s._id === this.selectedSongwriterId);
        if (selectedSongwriter) {
          this.contributorForm.patchValue({
            name: selectedSongwriter.name
          });
        }
      }
    });
  }

  // Autocomplete methods
  filterSongwriters(event: any): void {
    const query = event.target.value.toLowerCase().trim();
    
    if (query.length === 0) {
      this.filteredSongwriters = [...this.songwriters];
      this.showSongwriterSuggestions = false;
      this.selectedSongwriterId = '';
      this.availablePenNames = [];
      this.contributorForm.patchValue({
        selectedSongwriter: '',
        selectedPenName: '',
        name: ''
      });
    } else {
      this.filteredSongwriters = this.songwriters.filter(songwriter =>
        songwriter.name.toLowerCase().includes(query)
      );
      this.showSongwriterSuggestions = true;
    }
    
    this.highlightedSongwriterIndex = -1;
  }

  selectSongwriter(songwriter: Songwriter): void {
    // Update the input field with selected songwriter's name
    this.contributorForm.patchValue({
      songwriterInput: songwriter.name,
      selectedSongwriter: songwriter._id,
      name: songwriter.name,
      selectedPenName: '' // Reset pen name selection
    });
    
    // Store the selected songwriter's ID
    this.selectedSongwriterId = songwriter._id;
    
    // Update available pen names
    this.availablePenNames = songwriter.penNames || [];
    
    // Hide suggestions
    this.showSongwriterSuggestions = false;
    this.highlightedSongwriterIndex = -1;
  }

  hideSongwriterSuggestions(): void {
    // Small delay to allow click events on suggestions to fire
    setTimeout(() => {
      this.showSongwriterSuggestions = false;
      this.highlightedSongwriterIndex = -1;
    }, 200);
  }

  onSongwriterKeyDown(event: KeyboardEvent): void {
    if (!this.showSongwriterSuggestions || this.filteredSongwriters.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedSongwriterIndex = Math.min(
          this.highlightedSongwriterIndex + 1,
          this.filteredSongwriters.length - 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedSongwriterIndex = Math.max(this.highlightedSongwriterIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlightedSongwriterIndex >= 0) {
          this.selectSongwriter(this.filteredSongwriters[this.highlightedSongwriterIndex]);
        }
        break;
      case 'Escape':
        this.showSongwriterSuggestions = false;
        this.highlightedSongwriterIndex = -1;
        break;
    }
  }

  // Handler for contributor type toggle
  onContributorTypeChange(): void {
    if (!this.isTajaContributor) {
      // Switching to regular contributor - clear songwriter/pen name selections
      this.contributorForm.patchValue({
        songwriterInput: '',
        selectedSongwriter: '',
        selectedPenName: '',
        name: ''
      });
      this.selectedSongwriterId = '';
      this.availablePenNames = [];
      this.showSongwriterSuggestions = false;
    } else {
      // Switching to TAJA contributor - enable songwriter autocomplete
      this.contributorForm.patchValue({
        songwriterInput: '',
        name: ''
      });
      this.filteredSongwriters = [...this.songwriters];
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
    this.filteredSongwriters = [...this.songwriters];
    this.showSongwriterSuggestions = false;
    this.highlightedSongwriterIndex = -1;
    this.selectedSongwriterId = '';
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
    delete formData.songwriterInput; // Remove the autocomplete input field
    
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
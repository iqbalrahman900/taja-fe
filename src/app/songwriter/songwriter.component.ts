// src/app/songwriter/songwriter.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { 
  SongwriterService, 
  Songwriter, 
  SongwriterResponse 
} from '../services/songwriter.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UpdateSongwriterComponent } from '../modal/update-songwriter/update-songwriter.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-songwriter',
  templateUrl: './songwriter.component.html',
  styleUrls: ['./songwriter.component.scss']
})
export class SongwriterComponent implements OnInit {
  songwriters: Songwriter[] = [];
  totalSongwriters = 0;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';
  loading = false;
  expandedRows: boolean[] = [];
  upcomingBirthdays: Songwriter[] = [];
expiringContracts: Songwriter[] = [];
  
  // Initialize the form here to avoid the TypeScript error
  songwriterForm: FormGroup = this.createForm();
  formSubmitted = false;
  formError = '';

  constructor(
    private songwriterService: SongwriterService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadSongwriters();
    this.loadNotifications();
  }


  
  

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      contactNumber: ['', [Validators.required]],
      icNumber: ['', [Validators.required]],
      address: [''],              // Added address field
    macp: [false],              // Added MACP field with default false
    tinNumber: [''],  
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['', [Validators.required]],
      penNames: this.fb.array([this.createPenNameGroup()]),
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

  createPenNameGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      isActive: [true]
    });
  }

  get penNames(): FormArray {
    return this.songwriterForm.get('penNames') as FormArray;
  }

  addPenName(): void {
    this.penNames.push(this.createPenNameGroup());
  }

  removePenName(index: number): void {
    this.penNames.removeAt(index);
  }

  toggleDetailView(index: number): void {
    // Initialize the array with false values if it doesn't have enough entries
    while (this.expandedRows.length <= index) {
      this.expandedRows.push(false);
    }
    
    // Toggle the expanded state for the clicked row
    this.expandedRows[index] = !this.expandedRows[index];
  }

  loadSongwriters(): void {
    this.loading = true;
    this.songwriterService.getSongwriters(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response: SongwriterResponse) => {
          this.songwriters = response.data;
          this.totalSongwriters = response.total;
          
          // Reset the expanded rows array
          this.expandedRows = new Array(this.songwriters.length).fill(false);
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading songwriters:', err);
          this.loading = false;
          this.toastr.error('Failed to load songwriters. Please try again.', 'Error');
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSongwriters();
  }

  onSearch(): void {
    this.currentPage = 1; // Reset to first page
    this.loadSongwriters();
  }

  resetForm(): void {
    // Reset the form when opening the modal
    this.songwriterForm = this.createForm();
    this.formSubmitted = false;
    this.formError = '';
  }

  openAddModal(content: any): void {
    this.resetForm();
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  }

  openUpdateModal(songwriter: Songwriter): void {
    const modalRef = this.modalService.open(UpdateSongwriterComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.songwriter = songwriter;
    
    // When modal is closed with success
    modalRef.closed.subscribe(result => {
      if (result) {
        this.loadSongwriters(); // Refresh the list after update
      }
    });

    // Handle dismissal (optional)
    modalRef.dismissed.subscribe(() => {
      // You can add some code here if needed when modal is dismissed without saving
    });
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    if (this.songwriterForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.formError = '';
    
    this.songwriterService.createSongwriter(this.songwriterForm.value)
      .subscribe({
        next: (songwriter) => {
          this.loading = false;
          this.toastr.success(`${songwriter.name} was successfully added`, 'Songwriter Created');
          this.modalService.dismissAll();
          this.loadSongwriters(); // Refresh the list
        },
        error: (err) => {
          this.loading = false;
          this.formError = err.error?.message || 'Failed to create songwriter. Please try again.';
          this.toastr.error(this.formError, 'Creation Failed');
          console.error('Error creating songwriter:', err);
        }
      });
  }

  formatPenNames(penNames: any[]): string {
    if (!penNames || penNames.length === 0) {
      return '-';
    }
    return penNames.map(pn => pn.name).join(', ');
  }

  confirmDelete(songwriter: Songwriter): void {
    if (confirm(`Are you sure you want to delete ${songwriter.name}?`)) {
      this.loading = true;
      this.songwriterService.deleteSongwriter(songwriter._id)
        .subscribe({
          next: () => {
            this.loading = false;
            this.toastr.success(`${songwriter.name} was successfully deleted`, 'Songwriter Deleted');
            this.loadSongwriters(); // Refresh the list
          },
          error: (err) => {
            this.loading = false;
            console.error('Error deleting songwriter:', err);
            this.toastr.error('Failed to delete songwriter. Please try again.', 'Deletion Failed');
          }
        });
    }
  }

  calculateUpcomingBirthday(dob: string | Date): Date {
    const today = new Date();
    const birthDate = new Date(dob);
    
    // Create a date for this year's birthday
    const birthdayThisYear = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );
    
    // If the birthday has already occurred this year, set for next year
    if (birthdayThisYear < today) {
      birthdayThisYear.setFullYear(today.getFullYear() + 1);
    }
    
    return birthdayThisYear;
  }
  
  // Helper to check if a date is expiring within X days
  // Helper to check if a date is expiring within X days
isExpiringWithinDays(date: string | Date | undefined, days: number): boolean {
  if (!date) return false;
  
  const today = new Date();
  const expiryDate = new Date(date);
  const daysInMilliseconds = days * 24 * 60 * 60 * 1000;
  
  return expiryDate.getTime() - today.getTime() <= daysInMilliseconds;
}
  
  // Modify the loadNotifications to handle empty results
  loadNotifications(): void {
    this.loadUpcomingBirthdays();
    this.loadExpiringContracts();
  }
  
  // Update these methods to handle the empty array case properly
  loadUpcomingBirthdays(): void {
    this.songwriterService.getUpcomingBirthdays()
      .subscribe({
        next: (songwriters) => {
          this.upcomingBirthdays = songwriters || [];
          console.log('Upcoming birthdays loaded:', this.upcomingBirthdays.length);
        },
        error: (err) => {
          console.error('Error loading upcoming birthdays:', err);
          this.upcomingBirthdays = [];
        }
      });
  }
  
  loadExpiringContracts(): void {
    this.songwriterService.getExpiringContracts()
      .subscribe({
        next: (songwriters) => {
          this.expiringContracts = songwriters || [];
          console.log('Expiring contracts loaded:', this.expiringContracts.length);
        },
        error: (err) => {
          console.error('Error loading expiring contracts:', err);
          this.expiringContracts = [];
        }
      });
  }
}
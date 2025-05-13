import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  TaggingSongService, 
  TaggingSong, 
  TaggingSongResponse 
} from '../services/tagging-songs.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UpdateTaggingSongComponent } from '../modal/update-tagging-song/update-tagging-song.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-tagging-song',
  templateUrl: './tagging-song.component.html',
  styleUrls: ['./tagging-song.component.scss']
})
export class TaggingSongComponent implements OnInit {
  taggingSongs: TaggingSong[] = [];
  totalTags = 0;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';
  loading = false;
  expandedRows: boolean[] = [];
  
  // Initialize the form
  tagForm: FormGroup = this.createForm();
  formSubmitted = false;
  formError = '';

  constructor(
    private taggingSongService: TaggingSongService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadTags();
  }

  createForm(): FormGroup {
    return this.fb.group({
      categoryName: ['', [Validators.required]],
      isActive: [true]
    });
  }

  toggleDetailView(index: number): void {
    // Initialize the array with false values if it doesn't have enough entries
    while (this.expandedRows.length <= index) {
      this.expandedRows.push(false);
    }
    
    // Toggle the expanded state for the clicked row
    this.expandedRows[index] = !this.expandedRows[index];
  }

  loadTags(): void {
    this.loading = true;
    this.taggingSongService.getTaggingSongs(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response: TaggingSongResponse) => {
          this.taggingSongs = response.data;
          this.totalTags = response.total;
          
          // Reset the expanded rows array
          this.expandedRows = new Array(this.taggingSongs.length).fill(false);
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading tags:', err);
          this.loading = false;
          this.toastr.error('Failed to load tags. Please try again.', 'Error');
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTags();
  }

  onSearch(): void {
    this.currentPage = 1; // Reset to first page
    this.loadTags();
  }

  resetForm(): void {
    // Reset the form when opening the modal
    this.tagForm = this.createForm();
    this.formSubmitted = false;
    this.formError = '';
  }

  openAddModal(content: any): void {
    this.resetForm();
    this.modalService.open(content, { size: 'md', backdrop: 'static' });
  }

  openUpdateModal(tag: TaggingSong): void {
    const modalRef = this.modalService.open(UpdateTaggingSongComponent, { size: 'md', backdrop: 'static' });
    modalRef.componentInstance.taggingSong = tag;
    
    // When modal is closed with success
    modalRef.closed.subscribe(result => {
      if (result) {
        this.loadTags(); // Refresh the list after update
      }
    });
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    if (this.tagForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.formError = '';
    
    this.taggingSongService.createTaggingSong(this.tagForm.value)
      .subscribe({
        next: (tag) => {
          this.loading = false;
          this.toastr.success(`${tag.categoryName} was successfully added`, 'Tag Created');
          this.modalService.dismissAll();
          this.loadTags(); // Refresh the list
        },
        error: (err) => {
          this.loading = false;
          this.formError = err.error?.message || 'Failed to create tag. Please try again.';
          this.toastr.error(this.formError, 'Creation Failed');
          console.error('Error creating tag:', err);
        }
      });
  }

  confirmDelete(tag: TaggingSong): void {
    if (confirm(`Are you sure you want to delete ${tag.categoryName}?`)) {
      this.loading = true;
      this.taggingSongService.deleteTaggingSong(tag._id)
        .subscribe({
          next: () => {
            this.loading = false;
            this.toastr.success(`${tag.categoryName} was successfully deleted`, 'Tag Deleted');
            this.loadTags(); // Refresh the list
          },
          error: (err) => {
            this.loading = false;
            console.error('Error deleting tag:', err);
            this.toastr.error('Failed to delete tag. Please try again.', 'Deletion Failed');
          }
        });
    }
  }

  toggleStatus(tag: TaggingSong): void {
    this.loading = true;
    const updatedTag = {
      isActive: !tag.isActive
    };
    
    this.taggingSongService.updateTaggingSong(tag._id, updatedTag)
      .subscribe({
        next: (result) => {
          this.loading = false;
          const status = result.isActive ? 'activated' : 'deactivated';
          this.toastr.success(`${result.categoryName} was successfully ${status}`, 'Status Updated');
          this.loadTags(); // Refresh the list
        },
        error: (err) => {
          this.loading = false;
          console.error('Error updating tag status:', err);
          this.toastr.error('Failed to update tag status. Please try again.', 'Update Failed');
        }
      });
  }
}
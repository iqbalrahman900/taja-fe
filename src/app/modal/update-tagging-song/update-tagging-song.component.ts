import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TaggingSongService, TaggingSong } from '../../services/tagging-songs.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-update-tagging-song',
  templateUrl: './update-tagging-song.component.html',
  styleUrls: ['./update-tagging-song.component.scss']
})
export class UpdateTaggingSongComponent implements OnInit {
  @Input() taggingSong!: TaggingSong;
  
  tagForm: FormGroup = this.createForm();
  formSubmitted = false;
  formError = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private taggingSongService: TaggingSongService,
    public activeModal: NgbActiveModal,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Add debug logging to check the tagging song data
    console.log('Tagging song received:', this.taggingSong);
    
    this.initializeForm();
    
    // Add debug logging after form initialization
    console.log('Form values after initialization:', this.tagForm.value);
  }

  createForm(): FormGroup {
    return this.fb.group({
      categoryName: ['', [Validators.required]],
      isActive: [true]
    });
  }

  initializeForm(): void {
    if (this.taggingSong) {
      // Explicit debug logging before patching values
      console.log('About to patch form with tagging song data');
      
      // Set form values
      this.tagForm.patchValue({
        categoryName: this.taggingSong.categoryName,
        isActive: this.taggingSong.isActive
      });
      
      // Extra verification after patching
      console.log('Form values after patch:', this.tagForm.value);
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    if (this.tagForm.invalid) {
      return;
    }
    
    // Log the form value before submission
    console.log('Form value before submission:', this.tagForm.value);
    
    this.loading = true;
    this.formError = '';
    
    this.taggingSongService.updateTaggingSong(this.taggingSong._id, this.tagForm.value)
      .subscribe({
        next: (tag) => {
          this.loading = false;
          this.toastr.success(`${tag.categoryName} was successfully updated`, 'Update Successful');
          this.activeModal.close(tag);
        },
        error: (err) => {
          this.loading = false;
          this.formError = err.error?.message || 'Failed to update tag. Please try again.';
          this.toastr.error(this.formError, 'Update Failed');
          console.error('Error updating tag:', err);
        }
      });
  }
}
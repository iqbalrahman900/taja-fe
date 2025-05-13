// src/app/catalog-detail/catalog-detail.component.ts
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService, CatalogDetails, Contributor, CatalogStatus, Catalog } from '../services/catalog.service';
import { ToastrService } from 'ngx-toastr';
import { AddContributorModalComponent } from '../add-contributor-modal/add-contributor-modal.component';
import { AddDistributionModalComponent } from '../add-distribution-modal/add-distribution-modal.component';
import Swal from 'sweetalert2';
import { UpdateCatalogModalComponent } from '../modal/update-catalog-modal/update-catalog-modal.component';
import { UpdateContributorModalComponent } from '../modal/update-contributor-modal/update-contributor-modal.component';

@Component({
  selector: 'app-catalog-detail',
  templateUrl: './catalog-detail.component.html',
  styleUrls: ['./catalog-detail.component.scss']
})
export class CatalogDetailComponent implements OnInit, AfterViewInit {
  @ViewChild(AddContributorModalComponent) addContributorModal!: AddContributorModalComponent;
  @ViewChild(AddDistributionModalComponent) addDistributionModal!: AddDistributionModalComponent;
  @ViewChild(UpdateCatalogModalComponent) updateCatalogModal!: UpdateCatalogModalComponent;
  @ViewChild(UpdateContributorModalComponent) updateContributorModal!: UpdateContributorModalComponent;

  catalogDetails: CatalogDetails | null = null;
  loading = true;
  tapNumber: string = '';
  activeTab = 'info'; // Default active tab

  // Make CatalogStatus available to the template
  CatalogStatus = CatalogStatus;

  // Role labels for display
  roleLabels: { [key: string]: string } = {
    'C': 'Composer',
    'A': 'Author',
    'CA': 'Composer/Author',
    'AR': 'Arranger'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tapNumber = params['tapNumber'];
      this.loadCatalogDetails();
    });
  }

  openUpdateCatalogModal(): void {
    if (!this.catalogDetails?.catalog) {
      this.toastr.error('Catalog data is not available', 'Error');
      return;
    }
    
    if (!this.updateCatalogModal) {
      this.toastr.error('Modal component not initialized', 'Error');
      console.error('Update modal component reference is undefined');
      return;
    }
    
    this.updateCatalogModal.catalog = this.catalogDetails.catalog;
    this.updateCatalogModal.open();
  }
  
  // Add this handler
  onCatalogUpdated(updatedCatalog: Catalog): void {
    // Refresh the catalog details to show the updated data
    this.loadCatalogDetails();
    this.toastr.success('Catalog updated successfully', 'Success');
  }

  ngAfterViewInit(): void {
    // For debugging
    console.log('ViewChild initialization check:');
    console.log('addContributorModal:', this.addContributorModal);
    console.log('addDistributionModal:', this.addDistributionModal);
    console.log('updateContributorModal:', this.updateContributorModal);
  }

  loadCatalogDetails(): void {
    this.loading = true;
    this.catalogService.getCatalogDetails(this.tapNumber).subscribe({
      next: (details) => {
        this.catalogDetails = details;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading catalog details:', err);
        this.toastr.error('Failed to load catalog details', 'Error');
        this.loading = false;
      }
    });
  }

  confirmDelete(): void {
    if (!this.catalogDetails?.catalog) {
      this.toastr.error('Catalog data is not available', 'Error');
      return;
    }
  
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete catalog "${this.catalogDetails.catalog.title}" (${this.catalogDetails.catalog.tapNumber}). This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteCatalog();
      }
    });
  }
  
  deleteCatalog(): void {
    if (!this.catalogDetails?.catalog) {
      this.toastr.error('Catalog data is not available', 'Error');
      return;
    }
    
    this.catalogService.hardDeleteCatalog(this.catalogDetails.catalog._id).subscribe({
      next: () => {
        Swal.fire(
          'Deleted!',
          `Catalog "${this.catalogDetails?.catalog.title}" has been deleted.`,
          'success'
        );
        // Navigate back to catalogs list
        this.router.navigate(['/catalogs']);
      },
      error: (err) => {
        console.error('Error deleting catalog:', err);
        Swal.fire(
          'Error!',
          'Failed to delete catalog. ' + (err.error?.message || 'Please try again later.'),
          'error'
        );
      }
    });
  }

  // New method to update status
  updateStatus(newStatus: CatalogStatus): void {
    if (!this.catalogDetails?.catalog) {
      this.toastr.error('Catalog data is not available', 'Error');
      return;
    }
    
    this.catalogService.updateCatalog(this.catalogDetails.catalog._id, { status: newStatus }).subscribe({
      next: (response) => {
        if (this.catalogDetails && this.catalogDetails.catalog) {
          this.catalogDetails.catalog.status = response.status;
        }
        this.toastr.success(`Catalog status updated to ${newStatus}`, 'Success');
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to update catalog status', 'Error');
      }
    });
  }

  // Get status badge class based on current status
  getStatusBadgeClass(status: CatalogStatus): string {
    switch (status) {
      case CatalogStatus.PENDING:
        return 'pending';
      case CatalogStatus.ACTIVE:
        return 'active';
      case CatalogStatus.INACTIVE:
        return 'inactive';
      default:
        return '';
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  getRoleName(role: string): string {
    return this.roleLabels[role] || role;
  }

  getContributorRoleClasses(role: string): string {
    switch(role) {
      case 'C':
        return 'composer';
      case 'A':
        return 'author';
      case 'CA':
        return 'composer-author';
      case 'AR':
        return 'arranger';
      default:
        return '';
    }
  }

  getContributorsForRole(role: string): Contributor[] {
    if (!this.catalogDetails?.contributors) return [];
    return this.catalogDetails.contributors[role] || [];
  }

  getRolePercentageTotal(role: string): number {
    if (!this.catalogDetails?.royaltyTotals) return 0;
    return this.catalogDetails.royaltyTotals[role] || 0;
  }

  getPendingPaymentsCount(): number {
    if (!this.catalogDetails || !this.catalogDetails.incomes) {
      return 0;
    }
    return this.catalogDetails.incomes.filter(income => !income.paymentProcessed).length;
  }

  backToCatalogs(): void {
    this.router.navigate(['/catalogs']);
  }

  editCatalog(): void {
    if (!this.catalogDetails?.catalog) {
      this.toastr.error('Catalog data is not available', 'Error');
      return;
    }
    
    this.openUpdateCatalogModal();
  }

  openAddContributorModal(): void {
    if (!this.catalogDetails?.catalog) {
      this.toastr.error('Catalog data is not available', 'Error');
      return;
    }
    
    if (!this.addContributorModal) {
      this.toastr.error('Modal component not initialized', 'Error');
      console.error('Modal component reference is undefined');
      return;
    }
    
    this.addContributorModal.catalog = this.catalogDetails.catalog;
    this.addContributorModal.open();
  }

  openAddDistributionModal(): void {
    if (!this.catalogDetails?.catalog) {
      this.toastr.error('Catalog data is not available', 'Error');
      return;
    }
    
    if (!this.addDistributionModal) {
      this.toastr.error('Modal component not initialized', 'Error');
      console.error('Modal component reference is undefined');
      return;
    }
    
    this.addDistributionModal.catalog = this.catalogDetails.catalog;
    this.addDistributionModal.open();
  }

  openAddIncomeModal(): void {
    // This would be implemented when you create an income modal component
    this.toastr.info('Add income functionality will be implemented soon', 'Coming Soon');
  }

  onContributorAdded(): void {
    this.loadCatalogDetails(); // Refresh data
    this.toastr.success('Contributor added successfully', 'Success');
  }

  onDistributionAdded(): void {
    this.loadCatalogDetails(); // Refresh data
    this.toastr.success('Distribution added successfully', 'Success');
  }

  calculateRoyalties(incomeId: string): void {
    this.catalogService.calculateRoyalties(incomeId).subscribe({
      next: (result) => {
        this.toastr.success('Royalties calculated successfully', 'Success');
        this.loadCatalogDetails(); // Refresh data
      },
      error: (err) => {
        console.error('Error calculating royalties:', err);
        this.toastr.error('Failed to calculate royalties', 'Error');
      }
    });
  }

  processPayment(incomeId: string): void {
    this.catalogService.processPayment(incomeId).subscribe({
      next: (result) => {
        this.toastr.success('Payment processed successfully', 'Success');
        this.loadCatalogDetails(); // Refresh data
      },
      error: (err) => {
        console.error('Error processing payment:', err);
        this.toastr.error('Failed to process payment', 'Error');
      }
    });
  }

  hasAnyContributors(): boolean {
    if (!this.catalogDetails || !this.catalogDetails.contributors) {
      return false;
    }
    
    // Check if there are any contributors in any role
    const roles = ['C', 'A', 'CA', 'AR'];
    for (const role of roles) {
      if (this.getContributorsForRole(role).length > 0) {
        return true;
      }
    }
    
    return false;
  }

  editContributor(contributor: Contributor): void {
    if (!this.updateContributorModal) {
      this.toastr.error('Modal component not initialized', 'Error');
      console.error('Modal component reference is undefined');
      return;
    }
    
    this.updateContributorModal.contributor = contributor;
    this.updateContributorModal.open();
  }

  onContributorUpdated(updatedContributor: Contributor): void {
    this.loadCatalogDetails(); // Refresh data
    this.toastr.success('Contributor updated successfully', 'Success');
  }

  // NEW METHODS FOR COVER FUNCTIONALITY
  
  // Check if current catalog is a cover version
  isCoverVersion(): boolean {
    return this.catalogDetails?.catalog?.versionType === 'cover';
  }

  // Format performers with line breaks for multi-performer display
  formatPerformers(performers: string | undefined): string {
    if (!performers) {
      return '-';
    }
    
    // Split the performers string by slashes
    const performerArray = performers.split('/').map(performer => performer.trim());
    
    // If there's only one performer, return it without numbering
    if (performerArray.length === 1) {
      return performerArray[0];
    }
    
    // Format multiple performers as a numbered list
    const formattedPerformers = performerArray
      .map((performer, index) => `${index + 1}- ${performer}`)
      .join('<br>');
    
    return formattedPerformers;
  }

  // Navigate to view a cover song's details
  viewCoverDetails(cover: Catalog): void {
    this.router.navigate(['/catalogs', cover.tapNumber]);
  }

  // Navigate to view parent song details
  viewParentSong(): void {
    if (this.catalogDetails?.catalog?.parentTapNumber) {
      this.router.navigate(['/catalogs', this.catalogDetails.catalog.parentTapNumber]);
    }
  }

  // Helper method to get catalog type badge classes
  getCatalogTypeBadgeClass(type: string): string {
    switch(type) {
      case 'cover':
        return 'bg-info';
      case 'remix':
        return 'bg-warning';
      case 'adaptation':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  // Sort IPI codes with 100-prefix codes first
  sortedIpiCodes(): string[] {
    if (!this.catalogDetails?.catalog?.ipiCode || !this.catalogDetails.catalog.ipiCode.length) {
      return [];
    }
    
    // Sort the IPI codes to put codes starting with '100' first
    return [...this.catalogDetails.catalog.ipiCode].sort((a, b) => {
      const aStarts100 = a.startsWith('100');
      const bStarts100 = b.startsWith('100');
      
      if (aStarts100 && !bStarts100) return -1; // a comes first
      if (!aStarts100 && bStarts100) return 1;  // b comes first
      return 0; // keep original order for other cases
    });
  }
}
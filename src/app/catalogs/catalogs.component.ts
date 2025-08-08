// src/app/catalogs/catalogs.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CatalogService, Catalog, CatalogResponse, CatalogStatus, CatalogDetails, Contributor, SongType } from '../services/catalog.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AddCatalogModalComponent } from '../add-catalog-modal/add-catalog-modal.component';
import { AddContributorModalComponent } from '../add-contributor-modal/add-contributor-modal.component';
import { AddDistributionModalComponent } from '../add-distribution-modal/add-distribution-modal.component';

// Interface for storing processed contributor info
interface ProcessedContributors {
  authors: {
    name: string;
    role: string;
    royaltyPercentage: number;
  }[];
  publishers: {
    name: string;
    percentage: number;
    contributorName: string;
  }[];
}

@Component({
  selector: 'app-catalogs',
  templateUrl: './catalogs.component.html',
  styleUrls: ['./catalogs.component.scss']
})
export class CatalogsComponent implements OnInit {
  @ViewChild(AddCatalogModalComponent) addCatalogModal!: AddCatalogModalComponent;
  @ViewChild(AddContributorModalComponent) addContributorModal!: AddContributorModalComponent;
  @ViewChild(AddDistributionModalComponent) addDistributionModal!: AddDistributionModalComponent;
  
  catalogs: Catalog[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 10;
  catalogTypes = ['original', 'adaptation'];
  selectedType = '';
  coverCounts: { [tapNumber: string]: number } = {};

  selectedTagging = '';
allTaggings: string[] = [];
popularTaggings: { tagging: string; count: number }[] = [];
  
  // Replace showActiveOnly with selectedStatus
  selectedStatus: CatalogStatus | '' = ''; // Default to showing all statuses// Default to showing active catalogs
  
  // Make CatalogStatus available to the template
  CatalogStatus = CatalogStatus;
  
  // Status options for the dropdown
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: CatalogStatus.PENDING, label: 'Pending' },
    { value: CatalogStatus.ACTIVE, label: 'Active' },
    { value: CatalogStatus.INACTIVE, label: 'Inactive' }
  ];
  
  Math = Math; // Make Math available in the template

  // New properties for expanded row details
  expandedCatalogId: string | null = null;
  catalogDetails: CatalogDetails | null = null;
  loadingDetails = false;
  activeTab = 'info'; // Default active tab

  // Role labels for display
  roleLabels: { [key: string]: string } = {
    'C': 'Composer',
    'A': 'Author',
    'CA': 'Composer/Author',
    'AR': 'Arranger'
  };

  // Map to store contributors for each catalog
  catalogContributors: { [catalogId: string]: ProcessedContributors } = {};
  
  // Add property to store TAJA ARCHIVE totals
  private _tajaArchiveTotals: { [catalogId: string]: number } = {};

  constructor(
    private catalogService: CatalogService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadTaggingOptions();
  }

  loadTaggingOptions(): void {
    // Load all taggings for dropdown
    this.catalogService.getAllTaggings().subscribe({
      next: (taggings) => {
        this.allTaggings = taggings;
      },
      error: (err) => {
        console.error('Error loading taggings:', err);
      }
    });
  
    // Optionally load popular taggings
    this.catalogService.getPopularTaggings(20).subscribe({
      next: (popular) => {
        this.popularTaggings = popular;
      },
      error: (err) => {
        console.error('Error loading popular taggings:', err);
      }
    });
  }

  
  

  onTaggingChange(): void {
    this.currentPage = 1;
    this.loadCatalogs();
  }


  getTotalAllPercentages(role: string): number {
    if (!this.catalogDetails?.contributors) return 0;
    
    // Get all contributors for this role
    const contributors = this.catalogDetails.contributors[role] || [];
    
    let total = 0;
    
    // Calculate the sum of all three percentage types
    contributors.forEach(contributor => {
      // Add role percentage
      total += contributor.royaltyPercentage;
      
      // Add publisher percentage if it exists
      if (contributor.publisherPercentage) {
        total += contributor.publisherPercentage;
      }
      
      // Add sub-publisher percentage if it exists
      if (contributor.subPublisherPercentage) {
        total += contributor.subPublisherPercentage;
      }
    });
    
    // Return the total with 2 decimal places
    return parseFloat(total.toFixed(2));
  }

  loadContributorsForCatalog(catalogId: string, tapNumber: string): void {
    if (this.catalogContributors[catalogId]) {
      return; // Already loaded
    }
    
    this.catalogService.getContributorsByTapNumber(tapNumber).subscribe({
      next: (contributors) => {
        // Process and organize contributors
        const processed: ProcessedContributors = {
          authors: [],
          publishers: []
        };
        
        // Extract author info
        const authorRoles = ['A', 'C', 'CA', 'AR'];
        contributors.forEach(contributor => {
          if (authorRoles.includes(contributor.role)) {
            processed.authors.push({
              name: contributor.name,
              role: contributor.role,
              royaltyPercentage: contributor.royaltyPercentage
            });
            
            // Extract publisher info if present
            if (contributor.publisherName && contributor.publisherPercentage) {
              processed.publishers.push({
                name: contributor.publisherName,
                percentage: contributor.publisherPercentage,
                contributorName: contributor.name
              });
            }
          }
        });
        
        // Sort and process as before...
        processed.authors.sort((a, b) => b.royaltyPercentage - a.royaltyPercentage);
        // ... other processing
        
        // Store processed contributors
        this.catalogContributors[catalogId] = processed;
        
        // Calculate TAJA ARCHIVE total right here from the raw data
        let tajaTotal = 0;
        
        contributors.forEach(contributor => {
          // Check if TAJA is either the publisher OR the sub-publisher
          if (contributor.publisherName === 'TAJA ARCHIVE SDN BHD' || 
              contributor.subPublisherName === 'TAJA ARCHIVE SDN BHD') {
            
            // Sum all three components
            tajaTotal += contributor.royaltyPercentage + 
                        (contributor.publisherPercentage || 0) + 
                        (contributor.subPublisherPercentage || 0);
          }
        });
        
        // Store the calculated total
        if (!this._tajaArchiveTotals) this._tajaArchiveTotals = {};
        this._tajaArchiveTotals[catalogId] = tajaTotal;
      },
      error: (err) => {
        console.error(`Error loading contributors for catalog ${tapNumber}:`, err);
      }
    });
  }
  
  // Simplified method to just return the stored value
  getTajaArchiveTotal(catalogId: string): string {
    if (this._tajaArchiveTotals && this._tajaArchiveTotals[catalogId]) {
      return `${this._tajaArchiveTotals[catalogId].toFixed(2)}%`;
    }
    return '-';
  }
  onSearch(): void {
    this.currentPage = 1; // Reset to first page on new search
    this.loadCatalogs();
  }



  onTypeChange(): void {
    this.currentPage = 1;
    this.loadCatalogs();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadCatalogs();
  }

  onStatusUpdate(catalog: Catalog, newStatus: CatalogStatus): void {
    this.catalogService.updateCatalog(catalog._id, { status: newStatus }).subscribe({
      next: (response) => {
        catalog.status = response.status;
        this.toastr.success(`Catalog status updated to ${this.getStatusLabel(newStatus)}`, 'Success');
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to update catalog status', 'Error');
      }
    });
  }

  getStatusLabel(status: CatalogStatus): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  }

  getStatusBadgeClass(status: CatalogStatus): string {
    switch (status) {
      case CatalogStatus.PENDING:
        return 'badge bg-warning';
      case CatalogStatus.ACTIVE:
        return 'badge bg-success';
      case CatalogStatus.INACTIVE:
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedTagging = ''; // Add this line
    this.currentPage = 1;
    this.loadCatalogs();
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  // Toggle expanded row and load details
  toggleDetails(catalogId: string, tapNumber: string): void {
    if (this.expandedCatalogId === catalogId) {
      // If already expanded, collapse it
      this.expandedCatalogId = null;
      this.catalogDetails = null;
      return;
    }

    // Expand and load details
    this.expandedCatalogId = catalogId;
    this.loadCatalogDetails(tapNumber);
  }

  

  setActiveTab(tab: string): void {
    this.activeTab = tab;
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

  getTotalSubPublisherPercentage(role: string): number {
    if (!this.catalogDetails?.contributors) return 0;
    
    // Get all contributors for this role
    const contributors = this.catalogDetails.contributors[role] || [];
    
    // Calculate the sum of sub-publisher percentages
    const total = contributors.reduce((sum, contributor) => {
      return sum + (contributor.subPublisherPercentage || 0);
    }, 0);
    
    return parseFloat(total.toFixed(2));
  }

  getPublisherTotal(publisherName: string): void {
    if (!this.catalogDetails?.catalog) return;
    
    this.catalogService.getPublisherTotals(
      this.catalogDetails.catalog.tapNumber, 
      publisherName
    ).subscribe({
      next: (result) => {
        // You can display this information in a modal or tooltip
        this.toastr.info(
          `Total: ${result.grandTotal.toFixed(2)}% (Royalty: ${result.totalRoyaltyPercentage.toFixed(2)}%, 
           Publisher: ${result.totalPublisherPercentage.toFixed(2)}%, 
           Sub-Publisher: ${result.totalSubPublisherPercentage.toFixed(2)}%)`,
          `Totals for ${publisherName}`
        );
      },
      error: (err) => {
        console.error(`Error getting publisher totals for ${publisherName}:`, err);
        this.toastr.error('Failed to get publisher totals', 'Error');
      }
    });
  }

 

  getTotalPublisherPercentage(role: string): number {
    if (!this.catalogDetails?.contributors) return 0;
    
    // Get all contributors for this role
    const contributors = this.catalogDetails.contributors[role] || [];
    
    // Calculate the sum of publisher percentages
    const total = contributors.reduce((sum, contributor) => {
      return sum + (contributor.publisherPercentage || 0);
    }, 0);
    
    return parseFloat(total.toFixed(2));
  }

  getRolePercentageTotal(role: string): number {
    if (!this.catalogDetails?.contributors) return 0;
    
    // Get all contributors for this role
    const contributors = this.catalogDetails.contributors[role] || [];
    
    // Calculate the sum of royalty percentages manually
    const total = contributors.reduce((sum, contributor) => sum + contributor.royaltyPercentage, 0);
    
    // Return the total with 2 decimal places
    return parseFloat(total.toFixed(2));
  }

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

  getPendingPaymentsCount(): number {
    if (!this.catalogDetails || !this.catalogDetails.incomes) {
      return 0;
    }
    return this.catalogDetails.incomes.filter(income => !income.paymentProcessed).length;
  }

  updateStatus(newStatus: CatalogStatus): void {
    if (!this.catalogDetails?.catalog) {
      this.toastr.error('Catalog data is not available', 'Error');
      return;
    }
    
    this.catalogService.updateCatalog(this.catalogDetails.catalog._id, { status: newStatus }).subscribe({
      next: (response) => {
        if (this.catalogDetails && this.catalogDetails.catalog) {
          this.catalogDetails.catalog.status = response.status;
          
          // Also update the status in the main catalog list
          const catalog = this.catalogs.find(c => c._id === this.catalogDetails?.catalog._id);
          if (catalog) {
            catalog.status = response.status;
          }
        }
        this.toastr.success(`Catalog status updated to ${newStatus}`, 'Success');
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to update catalog status', 'Error');
      }
    });
  }

editCatalog(): void {
  if (!this.catalogDetails?.catalog) {
    this.toastr.error('Catalog data is not available', 'Error');
    return;
  }
  
  this.router.navigate(['/catalogs', this.catalogDetails.catalog.tapNumber]);
}

  editContributor(contributor: Contributor): void {
    this.toastr.info('Edit contributor functionality will be implemented soon', 'Coming Soon');
  }

  openAddCatalogModal(): void {
    this.addCatalogModal.open();
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
    if (this.catalogDetails && this.expandedCatalogId) {
      this.loadCatalogDetails(this.catalogDetails.catalog.tapNumber); // Refresh details data
    }
    this.toastr.success('Contributor added successfully', 'Success');
  }

  onDistributionAdded(): void {
    if (this.catalogDetails && this.expandedCatalogId) {
      this.loadCatalogDetails(this.catalogDetails.catalog.tapNumber); // Refresh details data
    }
    this.toastr.success('Distribution added successfully', 'Success');
  }

  calculateRoyalties(incomeId: string): void {
    this.catalogService.calculateRoyalties(incomeId).subscribe({
      next: (result) => {
        this.toastr.success('Royalties calculated successfully', 'Success');
        if (this.catalogDetails && this.expandedCatalogId) {
          this.loadCatalogDetails(this.catalogDetails.catalog.tapNumber); // Refresh details data
        }
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
        if (this.catalogDetails && this.expandedCatalogId) {
          this.loadCatalogDetails(this.catalogDetails.catalog.tapNumber); // Refresh details data
        }
      },
      error: (err) => {
        console.error('Error processing payment:', err);
        this.toastr.error('Failed to process payment', 'Error');
      }
    });
  }

  // Calculate total royalty percentage for a catalog
  getTotalRoyaltyForCatalog(catalogId: string): number {
    // If we have contributor data in our map
    if (this.catalogContributors[catalogId]?.authors) {
      // Sum all author royalty percentages
      const totalRoyalty = this.catalogContributors[catalogId].authors.reduce(
        (total, author) => total + author.royaltyPercentage, 
        0
      );
      // Format to 2 decimal places
      return parseFloat(totalRoyalty.toFixed(2));
    }
    
    // If we have catalog details and this is the expanded catalog
    if (this.catalogDetails?.catalog && this.expandedCatalogId === catalogId) {
      // Get the sum of all role totals
      const totalRoyalty = Object.values(this.catalogDetails.royaltyTotals).reduce(
        (total, percentage) => total + percentage,
        0
      );
      return parseFloat(totalRoyalty.toFixed(2));
    }
    
    // Default to 100% if no data available
    return 100.00;
  }
  
  onCatalogAdded(catalog: Catalog): void {
    this.loadCatalogs(); // Refresh the catalog list
    this.toastr.success(`Catalog "${catalog.title}" added successfully with status: PENDING`, 'Success');
  }

  hasAnyContributors(): boolean {
    if (!this.catalogDetails?.contributors) return false;
    
    // Check each role to see if there are any contributors
    for (const role of ['C', 'A', 'CA', 'AR']) {
      if (this.getContributorsForRole(role).length > 0) {
        return true;
      }
    }
    
    // No contributors found in any role
    return false;
  }

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

  // Update the loadCatalogs method in your CatalogsComponent

loadCatalogs(): void {
  this.loading = true;
  
  this.catalogService.getCatalogs(
    this.currentPage, 
    this.itemsPerPage, 
    this.searchTerm,
    this.selectedType || undefined,
    this.selectedStatus || undefined,
    undefined, // songType
    this.selectedTagging || undefined
  ).subscribe({
    next: (response: CatalogResponse) => {
      // Don't filter here - let the backend handle pagination
      this.catalogs = response.data || [];
      
      // Use the total from the response, not filtered length
      this.totalItems = response.total || 0;
      this.loading = false;
      
      // Pre-load contributor info for displayed catalogs
      this.catalogs.forEach(catalog => {
        this.loadContributorsForCatalog(catalog._id, catalog.tapNumber);
        
        // Check for covers if it's not a cover itself
        if (catalog.versionType !== 'cover') {
          this.checkForCovers(catalog.tapNumber);
        }
      });
    },
    error: (err) => {
      console.error('Error loading catalogs:', err);
      this.toastr.error('Failed to load catalog data', 'Error');
      this.loading = false;
    }
  });
}
  
  // Add method to check for covers
  checkForCovers(tapNumber: string): void {
    this.catalogService.getCoversByParentTap(tapNumber).subscribe({
      next: (covers) => {
        this.coverCounts[tapNumber] = covers.length;
      },
      error: (err) => {
        console.error(`Error checking for covers of ${tapNumber}:`, err);
        this.coverCounts[tapNumber] = 0;
      }
    });
  }
  
  // Add method to get cover count
  getCoverCount(tapNumber: string): number {
    return this.coverCounts[tapNumber] || 0;
  }

  // Update the loadCatalogDetails method in CatalogsComponent

loadCatalogDetails(tapNumber: string): void {
  this.loadingDetails = true;
  this.catalogService.getCatalogDetails(tapNumber).subscribe({
    next: (details) => {
      this.catalogDetails = details;
      
      // Load contributor info for covers
      if (details.covers && details.covers.length > 0) {
        details.covers.forEach(cover => {
          this.loadContributorsForCatalog(cover._id, cover.tapNumber);
        });
      }
      
      // ... rest of the existing code for processing contributors ...
      
      this.loadingDetails = false;
      this.activeTab = 'info'; // Reset to info tab when expanding new catalog
    },
    error: (err) => {
      console.error('Error loading catalog details:', err);
      this.toastr.error('Failed to load catalog details', 'Error');
      this.loadingDetails = false;
    }
  });
}

getCountryTooltip(): string {
  const countries = this.catalogDetails?.catalog?.selectedCountries;
  return countries && countries.length > 0
    ? countries.join(', ')
    : 'No countries selected';
}

getMainIpiCode(ipiCode?: string | string[]): string {
  if (!ipiCode) return '';
  
  // If ipiCode is already an array, use it directly
  // Otherwise, split the string by comma
  const codes = Array.isArray(ipiCode) ? ipiCode : ipiCode.split(',');
  
  // Find the first code that starts with '10'
  const mainCode = codes.find(code => {
    const trimmedCode = typeof code === 'string' ? code.trim() : '';
    return trimmedCode.startsWith('10');
  });
  
  // Return the matching code or the original value if no match
  return mainCode ? (typeof mainCode === 'string' ? mainCode.trim() : mainCode) : 
    (Array.isArray(ipiCode) ? ipiCode.join(',') : ipiCode);
}


getTotalPages(): number {
  return Math.ceil(this.totalItems / this.itemsPerPage);
}

getStartIndex(): number {
  return ((this.currentPage - 1) * this.itemsPerPage) + 1;
}

getEndIndex(): number {
  const endIndex = this.currentPage * this.itemsPerPage;
  return endIndex > this.totalItems ? this.totalItems : endIndex;
}

getPageNumbers(): number[] {
  const totalPages = this.getTotalPages();
  const pages: number[] = [];
  
  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show smart pagination with ellipsis logic
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
  }
  
  return pages;
}

// Update your existing onPageChange method to include validation
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCatalogs();
    // Reset expanded row when changing page
    this.expandedCatalogId = null;
    this.catalogDetails = null;
  }

// Update your loadCatalogs method to fix the API call


}
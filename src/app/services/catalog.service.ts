// src/app/services/catalog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Environment configuration
const API_URL = 'https://13.215.173.58'; // Update this with your API URL
// const API_URL = 'http://localhost:3000'; // Update this with your API URL

export enum CatalogStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CONFLICT = 'conflict',
}

export enum VersionType {
  REMIX = 'remix',
  COVER = 'cover',
}

export interface SongTypeStats {
  commercial: number;
  jingles: number;
  scoring: number;
  montage: number;
}

export enum SongType {
  COMMERCIAL = 'commercial',
  JINGLES = 'jingles',
  SCORING = 'scoring',
  MONTAGE = 'montage',
}

export interface StatusCounts {
  pending: number;
  active: number;
  inactive: number;
  conflict: number;
}

export interface UpdateContributorDto extends Partial<CreateContributorDto> {
  // Extend with any additional properties needed for updates
}

export interface Catalog {
  _id: string;
  tapNumber: string;
  title: string;
  versionType?: VersionType;
  alternateTitle?: string; // Added alternate title
  performer?: string;
  type: string;
  dateIn: Date;
  dateOut?: Date;
  genre?: string;
  remarks?: string;
  invCode?: string;
  ipiCode?: string[]; // Changed to string array
  iswcCode?: string;
  isrcCode?: string;
  tagging?: string;
  youtubeLink?: string; // Added YouTube link
  songType?: SongType;
  status: CatalogStatus;
  totalRevenue: number;
  parentTapNumber?: string;
  countrycover: number; // Changed from countryCover to countrycover
  selectedCountries: string[]; // Changed from string to string[]
  createdAt: Date;
  updatedAt: Date;
}

export interface Contributor {
  ipiNumber: null;
  _id: string;
  catalogId: string;
  tapNumber: string;
  name: string;
  role: string;
  royaltyPercentage: number;
  manager?: string;
  publisherType?: string;
  publisherName?: string;
  publisherPercentage?: number;
  subPublisherName?: string;
  subPublisherPercentage?: number;
}

export interface Distribution {
  _id: string;
  catalogId: string;
  tapNumber: string;
  distributor: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface Income {
  _id: string;
  catalogId: string;
  tapNumber: string;
  amount: number;
  source?: string;
  date: Date;
  royaltiesCalculated: boolean;
  paymentProcessed: boolean;
  paymentDate?: Date;
}

export interface CatalogDetails {
  catalog: Catalog;
  contributors: {
    [role: string]: Contributor[];
  };
  royaltyTotals: {
    [role: string]: number;
  };
  distributions: Distribution[];
  activeDistribution?: Distribution;
  incomes: Income[];
  totalRevenue: number;
  covers: Catalog[]; // Make sure covers property is included
}

export interface CatalogResponse {
  data: Catalog[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCatalogDto {
  tapNumber?: string;
  title: string;
  alternateTitle?: string; // Added alternate title
  type?: string;
  performer?: string;
  versionType?: VersionType;
  invCode?: string;
  ipiCode?: string[]; // Changed to string array
  iswcCode?: string;
  isrcCode?: string;
  tagging?: string;
  youtubeLink?: string; // Added YouTube link
  songType?: SongType;
  genre?: string;
  remarks?: string;
  dateIn?: Date;
  dateOut?: Date;
  audioFilePath?: string;
  parentTapNumber?: string;
  status?: CatalogStatus;
  countrycover?: number; // Changed from countryCover to countrycover
  selectedCountries?: string[]; // Changed from string to string[]
}

export interface CreateContributorDto {
  catalogId: string;
  tapNumber: string;
  name: string;
  role: string;
  royaltyPercentage: number;
  manager?: string;
  publisherType?: string;
  publisherName?: string;
  publisherPercentage?: number;
  subPublisherName?: string;
  subPublisherPercentage?: number;
}

export interface CreateDistributionDto {
  catalogId: string;
  tapNumber: string;
  distributor: string;
  startDate: Date;
  endDate?: Date;
}

export interface CreateIncomeDto {
  catalogId: string;
  tapNumber: string;
  amount: number;
  source?: string;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  constructor(private http: HttpClient) {}

  // Catalog methods
  getCatalogs(
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    type?: string, 
    status?: CatalogStatus,
    songType?: SongType,
    tagging?: string,
    includeCovers?: boolean // Add optional parameter to control cover inclusion
  ): Observable<CatalogResponse> {
    let url = `${API_URL}/catalogs?page=${page}&limit=${limit}`;
    
    if (search) {
      url += `&search=${search}`;
    }
    
    if (type) {
      url += `&type=${type}`;
    }
    
    if (status) {
      url += `&status=${status}`;
    }

    if (songType) {
      url += `&songType=${songType}`;
    }

    if (tagging) {
      url += `&tagging=${tagging}`;
    }
    
    // Add includeCovers parameter
    if (includeCovers !== undefined) {
      url += `&includeCovers=${includeCovers}`;
    }
    
    return this.http.get<CatalogResponse>(url);
  }

  getStatusCounts(): Observable<StatusCounts> {
    return this.http.get<StatusCounts>(`${API_URL}/catalogs/stats/status-counts`);
  }

  getCoversByParentTap(parentTapNumber: string): Observable<Catalog[]> {
    return this.http.get<Catalog[]>(`${API_URL}/catalogs/tap/${parentTapNumber}/covers`);
  }

  getAllTaggings(): Observable<string[]> {
    return this.http.get<string[]>(`${API_URL}/catalogs/all-taggings`);
  }

  getCatalog(id: string): Observable<Catalog> {
    return this.http.get<Catalog>(`${API_URL}/catalogs/${id}`);
  }

  getCatalogById(id: string): Observable<Catalog> {
    return this.http.get<Catalog>(`${API_URL}/catalogs/${id}`);
  }

  getPopularTaggings(limit: number = 10): Observable<{ tagging: string; count: number }[]> {
    return this.http.get<{ tagging: string; count: number }[]>(`${API_URL}/catalogs/popular-taggings?limit=${limit}`);
  }

  getCatalogByTapNumber(tapNumber: string): Observable<Catalog> {
    return this.http.get<Catalog>(`${API_URL}/catalogs/tap/${tapNumber}`);
  }

  createCatalog(catalog: CreateCatalogDto): Observable<Catalog> {
    // Status will be set to PENDING by the backend
    return this.http.post<Catalog>(`${API_URL}/catalogs`, catalog);
  }

  updateCatalog(id: string, catalog: Partial<CreateCatalogDto>): Observable<Catalog> {
    return this.http.patch<Catalog>(`${API_URL}/catalogs/${id}`, catalog);
  }

  updateCatalogByTapNumber(tapNumber: string, catalog: Partial<CreateCatalogDto>): Observable<Catalog> {
    // First get the catalog by TAP number to get its ID
    return new Observable(observer => {
      this.getCatalogByTapNumber(tapNumber).subscribe({
        next: (foundCatalog) => {
          // Then update using the ID
          this.updateCatalog(foundCatalog._id, catalog).subscribe({
            next: (updated) => {
              observer.next(updated);
              observer.complete();
            },
            error: (err) => observer.error(err)
          });
        },
        error: (err) => observer.error(err)
      });
    });
  }

  deleteCatalog(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/catalogs/${id}`);
  }

  hardDeleteCatalog(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/catalogs/${id}/hard`);
  }

  // Contributor methods
  addContributor(contributor: CreateContributorDto): Observable<Contributor> {
    return this.http.post<Contributor>(`${API_URL}/catalogs/contributor`, contributor);
  }

  getContributors(catalogId: string, role?: string): Observable<Contributor[]> {
    let url = `${API_URL}/catalogs/${catalogId}/contributors`;
    
    if (role) {
      url += `?role=${role}`;
    }
    
    return this.http.get<Contributor[]>(url);
  }

  getContributorsByTapNumber(tapNumber: string, role?: string): Observable<Contributor[]> {
    let url = `${API_URL}/catalogs/tap/${tapNumber}/contributors`;
    
    if (role) {
      url += `?role=${role}`;
    }
    
    return this.http.get<Contributor[]>(url);
  }

  getPublisherTotals(tapNumber: string, publisherName: string): Observable<any> {
    // Encode the publisher name to handle spaces and special characters in the URL
    const encodedPublisherName = encodeURIComponent(publisherName);
    return this.http.get<any>(`${API_URL}/catalogs/tap/${tapNumber}/publisher/${encodedPublisherName}`);
  }

  // Distribution methods
  addDistribution(distribution: CreateDistributionDto): Observable<Distribution> {
    return this.http.post<Distribution>(`${API_URL}/catalogs/distribution`, distribution);
  }

  getDistributions(tapNumber: string): Observable<Distribution[]> {
    return this.http.get<Distribution[]>(`${API_URL}/catalogs/tap/${tapNumber}/distributions`);
  }

  getActiveDistribution(tapNumber: string): Observable<Distribution> {
    return this.http.get<Distribution>(`${API_URL}/catalogs/tap/${tapNumber}/distribution/active`);
  }

  // Income methods
  recordIncome(income: CreateIncomeDto): Observable<Income> {
    return this.http.post<Income>(`${API_URL}/catalogs/income`, income);
  }

  getIncomes(tapNumber: string): Observable<Income[]> {
    return this.http.get<Income[]>(`${API_URL}/catalogs/tap/${tapNumber}/incomes`);
  }

  calculateRoyalties(incomeId: string): Observable<any> {
    return this.http.post<any>(`${API_URL}/catalogs/income/${incomeId}/calculate-royalties`, {});
  }

  processPayment(incomeId: string): Observable<any> {
    return this.http.post<any>(`${API_URL}/catalogs/income/${incomeId}/process-payment`, {});
  }

  // Full details
  getCatalogDetails(tapNumber: string): Observable<CatalogDetails> {
    return this.http.get<CatalogDetails>(`${API_URL}/catalogs/tap/${tapNumber}/details`);
  }

  getCatalogDetailsById(id: string): Observable<CatalogDetails> {
    // Find the catalog's TAP number first, then get details
    return new Observable(observer => {
      this.getCatalogById(id).subscribe({
        next: (catalog) => {
          this.getCatalogDetails(catalog.tapNumber).subscribe({
            next: (details) => {
              observer.next(details);
              observer.complete();
            },
            error: (err) => observer.error(err)
          });
        },
        error: (err) => observer.error(err)
      });
    });
  }

  getSongTypeStats(): Observable<SongTypeStats> {
    return this.http.get<SongTypeStats>(`${API_URL}/catalogs/stats/song-types`);
  }

  updateContributor(id: string, contributor: UpdateContributorDto): Observable<Contributor> {
    return this.http.patch<Contributor>(`${API_URL}/catalogs/contributor/${id}`, contributor);
  }

  // Cover-specific functionality
  getCatalogsWithoutCovers(
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    type?: string, 
    status?: CatalogStatus,
    songType?: SongType,
    tagging?: string
  ): Observable<CatalogResponse> {
    // Explicitly exclude covers from the response
    return this.getCatalogs(page, limit, search, type, status, songType, tagging, false);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'https://13.215.173.58';
// const API_URL = 'http://localhost:3000';

export interface Contract {
  type: string;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
  terms?: string;
}

export interface OriginalPublishing {
  _id: string;
  companyName: string;
  officialEmail: string;
  companyRegistrationNo: string;
  tinNumber: string;
  address: string;
  picName: string;
  picTelNo: string;
  picEmail: string;
  picPosition: string;
  deal?: string;
  contract?: Contract;
  createdAt: Date;
  updatedAt: Date;
}

export interface OriginalPublishingResponse {
  data: OriginalPublishing[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateOriginalPublishingDto {
  companyName: string;
  officialEmail: string;
  companyRegistrationNo: string;
  tinNumber: string;
  address: string;
  picName: string;
  picTelNo: string;
  picEmail: string;
  picPosition: string;
  deal?: string;
  contract?: Contract;
}

export type UpdateOriginalPublishingDto = Partial<CreateOriginalPublishingDto>;

@Injectable({
  providedIn: 'root'
})
export class OriginalPublishingService {
  // Rest of the service remains the same
  constructor(private http: HttpClient) { }

  getOriginalPublishings(page = 1, limit = 10, search?: string): Observable<OriginalPublishingResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<OriginalPublishingResponse>(`${API_URL}/original-publishing`, { params });
  }

  getOriginalPublishingById(id: string): Observable<OriginalPublishing> {
    return this.http.get<OriginalPublishing>(`${API_URL}/original-publishing/${id}`);
  }

  getByRegistrationNo(regNo: string): Observable<OriginalPublishing> {
    return this.http.get<OriginalPublishing>(`${API_URL}/original-publishing/registration/${regNo}`);
  }

  createOriginalPublishing(data: CreateOriginalPublishingDto): Observable<OriginalPublishing> {
    return this.http.post<OriginalPublishing>(`${API_URL}/original-publishing`, data);
  }

  updateOriginalPublishing(id: string, data: UpdateOriginalPublishingDto): Observable<OriginalPublishing> {
    return this.http.patch<OriginalPublishing>(`${API_URL}/original-publishing/${id}`, data);
  }

  deleteOriginalPublishing(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/original-publishing/${id}`);
  }
}
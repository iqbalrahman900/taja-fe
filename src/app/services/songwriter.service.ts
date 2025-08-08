// src/app/services/songwriter.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'https://13.215.173.58';
// const API_URL = 'http://localhost:3000';

export interface PenName {
  name: string;
  isActive: boolean;
  _id?: string;
}

export interface Heir {
  name: string;
  contactNumber: string;
  relationship: string;
}

export interface Contract {
  type: string;
  startDate: Date | string;
  endDate?: Date | string;
  isActive?: boolean;
  terms?: string;
}

export interface Songwriter {
  _id: string;
  name: string;
  contactNumber: string;
  icNumber: string;
  email: string;
  address: string;       // Added address field
  macp: boolean;         // Added MACP field
  tinNumber: string;     // Added TIN Number field
  dateOfBirth: Date | string;
  penNames: PenName[];
  contract?: Contract;
  deal?: string;
  heir?: Heir;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SongwriterResponse {
  data: Songwriter[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class SongwriterService {


  constructor(private http: HttpClient) { }

  getSongwriters(page = 1, limit = 10, search = ''): Observable<SongwriterResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<SongwriterResponse>(`${API_URL}/songwriters`, { params });
  }

  getSongwriter(id: string): Observable<Songwriter> {
    return this.http.get<Songwriter>(`${API_URL}/songwriters/${id}`);
  }

  createSongwriter(songwriter: Partial<Songwriter>): Observable<Songwriter> {
    return this.http.post<Songwriter>(`${API_URL}/songwriters`, songwriter);
  }

  updateSongwriter(id: string, songwriter: Partial<Songwriter>): Observable<Songwriter> {
    return this.http.patch<Songwriter>(`${API_URL}/songwriters/${id}`, songwriter);
  }

  deleteSongwriter(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/songwriters/${id}`);
  }

  addPenName(songwriterId: string, penName: string): Observable<Songwriter> {
    return this.http.post<Songwriter>(`${API_URL}/songwriters/${songwriterId}/pen-names`, { name: penName });
  }

  removePenName(songwriterId: string, penNameId: string): Observable<Songwriter> {
    return this.http.delete<Songwriter>(`${API_URL}/songwriters/${songwriterId}/pen-names/${penNameId}`);
  }

  // Add these methods to the SongwriterService class

getUpcomingBirthdays(): Observable<Songwriter[]> {
  return this.http.get<Songwriter[]>(`${API_URL}/songwriters/upcoming-birthdays`);
}

getExpiringContracts(): Observable<Songwriter[]> {
  return this.http.get<Songwriter[]>(`${API_URL}/songwriters/expiring-contracts`);
}
}
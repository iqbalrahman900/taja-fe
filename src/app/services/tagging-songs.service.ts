import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

 const API_URL = 'https://13.215.173.58';
// const API_URL = 'http:locahost:3000';

export interface TaggingSong {
  _id: string;
  categoryName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaggingSongResponse {
  data: TaggingSong[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaggingSongService {

  constructor(private http: HttpClient) { }

  getTaggingSongs(page = 1, limit = 10, search = ''): Observable<TaggingSongResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<TaggingSongResponse>(`${API_URL}/tagging-songs`, { params });
  }

  getTaggingSong(id: string): Observable<TaggingSong> {
    return this.http.get<TaggingSong>(`${API_URL}/tagging-songs/${id}`);
  }

  getActiveTaggingSongs(): Observable<TaggingSong[]> {
    return this.http.get<TaggingSong[]>(`${API_URL}/tagging-songs/active`);
  }

  createTaggingSong(taggingSong: Partial<TaggingSong>): Observable<TaggingSong> {
    return this.http.post<TaggingSong>(`${API_URL}/tagging-songs`, taggingSong);
  }

  updateTaggingSong(id: string, taggingSong: Partial<TaggingSong>): Observable<TaggingSong> {
    return this.http.patch<TaggingSong>(`${API_URL}/tagging-songs/${id}`, taggingSong);
  }

  deleteTaggingSong(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/tagging-songs/${id}`);
  }
}
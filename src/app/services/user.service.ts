// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth.service';

// Environment configuration
const API_URL = 'http://localhost:3000'; // Update this with your API URL

export interface CreateUserRequest {
  username: string;
  password: string;
  role: string;
  companyName: string;
  fullName?: string;
  email?: string;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: string;
  companyName?: string;
  fullName?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  // Get all users (admin only)
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/users`);
  }

  // Get a specific user by ID
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${API_URL}/users/${id}`);
  }

  // Create a new user (admin only)
  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${API_URL}/users`, user);
  }

  // Update a user (admin only)
  updateUser(id: string, user: UpdateUserRequest): Observable<User> {
    return this.http.patch<User>(`${API_URL}/users/${id}`, user);
  }

  // Delete a user (admin only)
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/users/${id}`);
  }
}
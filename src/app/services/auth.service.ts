// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Environment configuration
 const API_URL = 'https://13.215.173.58'; // Update this with your API URL
// const API_URL = 'http://localhost:3000'; // Update this with your API URL


export interface AuditLogsParams {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

export interface User {
  id: string;
  username: string;
  role: string;
  companyName: string;
  fullName?: string;
  email?: string;
  isActive?: boolean;
  createdBy?: {
    id: string;
    username: string;
    fullName?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email?: string;
  companyName: string;
  fullName?: string;
  role?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Try to load user from localStorage OR sessionStorage
    let storedUser = localStorage.getItem('currentUser');
    
    // If not found in localStorage, try sessionStorage
    if (!storedUser) {
      storedUser = sessionStorage.getItem('currentUser');
    }
    
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string, rememberMe: boolean): Observable<AuthResponse> {
    return this.http.post<any>(`${API_URL}/auth/login`, { username, password })
      .pipe(
        map(response => {
          // Handle different response structures
          const authResponse: AuthResponse = {
            accessToken: response.accessToken || response.data?.accessToken,
            user: response.user || response.data?.user
          };
          return authResponse;
        }),
        tap(response => {
          // Store user based on rememberMe preference
          if (rememberMe) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            // Clean up any previous session storage
            sessionStorage.removeItem('currentUser');
          } else {
            sessionStorage.setItem('currentUser', JSON.stringify(response.user));
            // Clean up any previous local storage
            localStorage.removeItem('currentUser');
          }
          
          // Store token in both cases
          localStorage.setItem('token', response.accessToken);
          
          // Update the BehaviorSubject
          this.currentUserSubject.next(response.user);
        }),
        catchError(error => {
          console.error('Login failed:', error);
          throw error;
        })
      );
  }

  logout(): void {
    // Remove user from both storage options and reset the BehaviorSubject
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'admin';
  }

  // USER MANAGEMENT METHODS

  // Get all users (Admin only)
  getUsers(includeInactive: boolean = false): Observable<User[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.http.get<User[]>(`${API_URL}/users${params}`)
      .pipe(
        map(response => {
          // Handle different response structures
          if (Array.isArray(response)) {
            return response; // Direct array response
          } else if (response && (response as any).data) {
            return (response as any).data; // Wrapped in data property
          } else {
            return []; // Fallback to empty array
          }
        }),
        catchError(error => {
          console.error('Error fetching users:', error);
          throw error;
        })
      );
  }

  getAuditLogs(params: AuditLogsParams): Observable<any> {
  let httpParams = new HttpParams();
  
  Object.keys(params).forEach(key => {
    const value = params[key as keyof AuditLogsParams];
    if (value !== undefined && value !== null && value !== '') {
      httpParams = httpParams.set(key, value);
    }
  });

  return this.http.get<any>(`${API_URL}/audit/logs`, { params: httpParams })
    .pipe(
      catchError(error => {
        console.error('Error fetching audit logs:', error);
        throw error;
      })
    );
}

  // Get single user by ID
  getUser(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${API_URL}/users/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching user:', error);
          throw error;
        })
      );
  }

  // Create new user (Admin only)
  createUser(userData: CreateUserRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${API_URL}/users`, userData)
      .pipe(
        catchError(error => {
          console.error('Error creating user:', error);
          throw error;
        })
      );
  }

  // Update user (Admin only)
  updateUser(id: string, userData: Partial<CreateUserRequest>): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${API_URL}/users/${id}`, userData)
      .pipe(
        catchError(error => {
          console.error('Error updating user:', error);
          throw error;
        })
      );
  }

  // Deactivate user (Admin only)
  deactivateUser(id: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API_URL}/users/${id}/deactivate`, {})
      .pipe(
        catchError(error => {
          console.error('Error deactivating user:', error);
          throw error;
        })
      );
  }

  // Activate user (Admin only)
  activateUser(id: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API_URL}/users/${id}/activate`, {})
      .pipe(
        catchError(error => {
          console.error('Error activating user:', error);
          throw error;
        })
      );
  }

  // Get user statistics (Admin only)
  getUserStats(): Observable<ApiResponse<UserStats>> {
    return this.http.get<ApiResponse<UserStats>>(`${API_URL}/users/stats`)
      .pipe(
        catchError(error => {
          console.error('Error fetching user stats:', error);
          throw error;
        })
      );
  }

  // Get current user profile
  getUserProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${API_URL}/users/profile`)
      .pipe(
        catchError(error => {
          console.error('Error fetching user profile:', error);
          throw error;
        })
      );
  }

  // Helper method to get HTTP headers with auth token
  private getAuthHeaders() {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}
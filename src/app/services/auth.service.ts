// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Environment configuration
const API_URL = 'https://13.215.173.58'; // Update this with your API URL

export interface User {
  id: string;
  username: string;
  role: string;
  companyName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
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
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { username, password })
      .pipe(
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
          return of({ accessToken: '', user: {} as User });
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
}
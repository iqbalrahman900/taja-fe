// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If we have a token, add it to the request headers
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    // Handle the request and catch any errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // If we get a 401 Unauthorized response, redirect to login
        if (error.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          sessionStorage.removeItem('currentUser');
          this.router.navigate(['/login']);
        }
        
        return throwError(() => error);
      })
    );
  }
}
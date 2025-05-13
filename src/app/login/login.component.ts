// src/app/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  submitted = false;
  loading = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    // Redirect to dashboard if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';

    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { username, password, rememberMe } = this.loginForm.value;

    this.authService.login(username, password, rememberMe)
      .subscribe({
        next: (response) => {
          if (response.accessToken) {
            this.toastr.success('Login successful!', 'Welcome');
            this.router.navigate(['/dashboard']);
          } else {
            this.error = 'Invalid login credentials';
            this.toastr.error('Invalid login credentials', 'Login Failed');
            this.loading = false;
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Login failed. Please try again.';
          this.error = errorMessage;
          this.toastr.error(errorMessage, 'Login Failed');
          this.loading = false;
        }
      });
  }
}
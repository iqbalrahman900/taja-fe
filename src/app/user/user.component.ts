// src/app/user/user.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User, CreateUserRequest } from '../services/auth.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  // Component properties
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = true;
  error = '';
  showCreateModal = false;
  creatingUser = false;
  
  // Filter properties
  includeInactive = false;
  roleFilter = '';
  
  // Form
  createUserForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    // Initialize create user form
    this.createUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.email]],
      companyName: ['', [Validators.required]],
      fullName: [''],
      role: ['user', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Initialize arrays to prevent undefined errors
    this.users = [];
    this.filteredUsers = [];
    this.loadUsers();
  }

  // Load users from API
  loadUsers(): void {
    this.loading = true;
    this.error = '';
    
    this.authService.getUsers(this.includeInactive).subscribe({
      next: (users) => {
        console.log('Users loaded:', users); // Debug log
        this.users = Array.isArray(users) ? users : [];
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = error.error?.message || 'Failed to load users';
        this.users = []; // Initialize as empty array on error
        this.filteredUsers = [];
        this.loading = false;
      }
    });
  }

  // Apply filters to users list
  applyFilters(): void {
    // Ensure users is an array before filtering
    if (!Array.isArray(this.users)) {
      console.warn('Users is not an array, initializing as empty array');
      this.users = [];
      this.filteredUsers = [];
      return;
    }

    console.log('Applying filters to users:', this.users);
    console.log('includeInactive:', this.includeInactive);
    console.log('roleFilter:', this.roleFilter);

    this.filteredUsers = this.users.filter(user => {
      console.log('Filtering user:', user.username, 'isActive:', user.isActive, 'role:', user.role);
      
      // Status filter - if isActive is undefined or null, treat as active
      const userIsActive = user.isActive !== false; // true if undefined, null, or true
      if (!this.includeInactive && !userIsActive) {
        console.log('Filtered out inactive user:', user.username);
        return false;
      }
      
      // Role filter
      if (this.roleFilter && user.role !== this.roleFilter) {
        console.log('Filtered out by role:', user.username, 'expected:', this.roleFilter, 'actual:', user.role);
        return false;
      }
      
      console.log('User passed filters:', user.username);
      return true;
    });

    console.log('Filtered users result:', this.filteredUsers);
  }

  // Modal management
  openCreateModal(): void {
    this.showCreateModal = true;
    this.createUserForm.reset();
    this.createUserForm.patchValue({ role: 'user' });
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createUserForm.reset();
  }

  // Create user
  onCreateUser(): void {
    if (this.createUserForm.valid) {
      this.creatingUser = true;
      const userData: CreateUserRequest = this.createUserForm.value;
      
      this.authService.createUser(userData).subscribe({
        next: (response) => {
          console.log('User created successfully:', response);
          this.closeCreateModal();
          this.loadUsers(); // Refresh the users list
          this.creatingUser = false;
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.error = error.error?.message || 'Failed to create user';
          this.creatingUser = false;
        }
      });
    }
  }

  // Edit user
  editUser(user: User): void {
    console.log('Edit user:', user);
    // Implement edit functionality
    alert(`Edit functionality for ${user.username} will be implemented`);
  }

  // Toggle user status
  toggleUserStatus(user: User): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    const confirmMessage = `Are you sure you want to ${action} ${user.username}?`;
    
    if (confirm(confirmMessage)) {
      const apiCall = user.isActive ? 
        this.authService.deactivateUser(user.id) : 
        this.authService.activateUser(user.id);
      
      apiCall.subscribe({
        next: (response) => {
          console.log(`User ${user.username} ${action}d successfully`);
          this.loadUsers(); // Refresh the users list
        },
        error: (error) => {
          console.error(`Error ${action}ing user:`, error);
          this.error = error.error?.message || `Failed to ${action} user`;
        }
      });
    }
  }

  // Statistics methods
  getTotalUsers(): number {
    return this.users.length;
  }

  getActiveUsers(): number {
    return this.users.filter(user => user.isActive !== false).length; // Count undefined/null as active
  }

  getAdminUsers(): number {
    return this.users.filter(user => user.role === 'admin' && user.isActive !== false).length;
  }
}

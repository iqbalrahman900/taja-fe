// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../services/auth.service';
import { CatalogService } from '../services/catalog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isAdmin = false;
  sidebarCollapsed = false;
  activeMenuItem = 'dashboard';

  // Dashboard stats
  totalSongs = 0;
  totalRevenue = 0;
  pendingApprovals = 0;
  recentActivity: any[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    private catalogService: CatalogService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.isAdmin = this.authService.isAdmin();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load catalog stats
    this.catalogService.getCatalogs(1, 0).subscribe({
      next: (response) => {
        this.totalSongs = response.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading catalog stats:', err);
        this.loading = false;
      }
    });

    // For demo purposes we'll use placeholder data
    // In a real application, you would have specific endpoints for dashboard stats
    this.totalRevenue = 8450;
    this.pendingApprovals = 12;

    // Placeholder recent activity
    this.recentActivity = [
      {
        song: 'Cinta Abadi',
        artist: 'Iqbal',
        action: 'Registration',
        date: '15/03/2025'
      },
      {
        song: 'Cinta Abadi (Remix)',
        artist: 'Iqbal ft. DJ Kito',
        action: 'Version Created',
        date: '17/03/2025'
      },
      {
        song: 'Memories of You',
        artist: 'Rahman',
        action: 'Registration',
        date: '18/03/2025'
      },
      {
        song: 'Summer Days',
        artist: 'MusikaGroup Band',
        action: 'Distribution Change',
        date: '20/03/2025'
      }
    ];
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  navigateTo(page: string): void {
    this.activeMenuItem = page;

    switch (page) {
      case 'dashboard':
        this.router.navigate(['/dashboard']);
        break;
      case 'catalogs':
        this.router.navigate(['/catalogs']);
        break;
      case 'catalog-codes':
        // Temporarily stay on dashboard until catalog codes page is implemented
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  setActiveMenuItem(item: string): void {
    this.activeMenuItem = item;

    switch (item) {
      case 'dashboard':
        this.router.navigate(['/dashboard']);
        break;
      case 'catalogs':
        this.router.navigate(['/catalogs']);
        break;
      case 'catalog-codes':
        this.router.navigate(['/catalog-codes']);
        break;
      case 'songwriters':
        this.router.navigate(['/songwriters']);
        break;
      case 'taggingSong':
        this.router.navigate(['/taggingSong']);
        break;
      case 'originalPublishing':
        this.router.navigate(['/originalPublishing']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
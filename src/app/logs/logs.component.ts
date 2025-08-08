// src/app/logs/logs.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Define interfaces for the log data
export interface AuditLog {
  _id: string;
  userId: {
    _id: string;
    username: string;
    fullName?: string;
    role: string;
  };
  username: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  entityType: string;
  entityId: string;
  changes?: any;
  metadata?: {
    tapNumber?: string;
    operation?: string;
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LogFilters {
  userId?: string;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {
  // Component state
  logs: AuditLog[] = [];
  loading = true;
  error = '';
  showChangesModal = false;
  selectedLog: AuditLog | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalLogs = 0;
  totalPages = 0;

  // Statistics
  todayLogs = 0;
  uniqueUsers: { id: string; username: string; }[] = [];

  // Filters
  filters: LogFilters = {
    page: 1,
    limit: 20
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  // Load audit logs from API
  loadLogs(): void {
    this.loading = true;
    this.error = '';

    // Build query parameters
    const params: any = {
      page: this.currentPage.toString(),
      limit: this.itemsPerPage.toString(),
    };

    if (this.filters.userId) params.userId = this.filters.userId;
    if (this.filters.entityType) params.entityType = this.filters.entityType;
    if (this.filters.action) params.action = this.filters.action;
    if (this.filters.startDate) params.startDate = this.filters.startDate;
    if (this.filters.endDate) params.endDate = this.filters.endDate;

    // Make API call (you'll need to add this method to your auth service or create audit service)
    this.authService.getAuditLogs(params).subscribe({
      next: (response: any) => {
        console.log('Audit logs response:', response);
        
        if (response.data) {
          this.logs = response.data.logs || [];
          this.totalLogs = response.data.pagination?.total || 0;
          this.totalPages = response.data.pagination?.totalPages || 0;
          this.currentPage = response.data.pagination?.page || 1;
          
          this.calculateStatistics();
          this.extractUniqueUsers();
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        this.error = error.error?.message || 'Failed to load activity logs';
        this.loading = false;
      }
    });
  }

  // Calculate statistics
  calculateStatistics(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.todayLogs = this.logs.filter(log => {
      const logDate = new Date(log.createdAt);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    }).length;
  }

  // Extract unique users for filter dropdown
  extractUniqueUsers(): void {
    const userMap = new Map();
    
    this.logs.forEach(log => {
      if (log.userId && !userMap.has(log.userId._id)) {
        userMap.set(log.userId._id, {
          id: log.userId._id,
          username: log.userId.username || log.username
        });
      }
    });

    this.uniqueUsers = Array.from(userMap.values());
  }

  // Apply filters
  applyFilters(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  // Clear all filters
  clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 20
    };
    this.currentPage = 1;
    this.loadLogs();
  }

  // Pagination methods
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadLogs();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalLogs);
  }

  // UI Helper methods
  getLogRowClass(action: string): string {
    return `log-row action-${action.toLowerCase()}`;
  }

  getActionClass(action: string): string {
    const classes: { [key: string]: string } = {
      'CREATE': 'action-create',
      'UPDATE': 'action-update', 
      'DELETE': 'action-delete',
      'VIEW': 'action-view'
    };
    return classes[action] || 'action-default';
  }

  getActionIcon(action: string): string {
    const icons: { [key: string]: string } = {
      'CREATE': '➕',
      'UPDATE': '✏️',
      'DELETE': '🗑️',
      'VIEW': '👁️'
    };
    return icons[action] || '❓';
  }

  formatOperation(operation: string | undefined): string {
    if (!operation) return '';
    return operation
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const logDate = new Date(date);
    const diffMs = now.getTime() - logDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  // Changes modal methods
  selectLog(log: AuditLog): void {
    this.selectedLog = log;
  }

  viewChanges(log: AuditLog): void {
    this.selectedLog = log;
    this.showChangesModal = true;
  }

  closeChangesModal(): void {
    this.showChangesModal = false;
    this.selectedLog = null;
  }

  getChangesCount(changes: any): number {
    if (!changes) return 0;
    return Object.keys(changes).length;
  }

  getChangesArray(changes: any): any[] {
    if (!changes) return [];
    
    return Object.keys(changes).map(field => ({
      field: field,
      ...changes[field],
      value: changes[field]
    }));
  }

  getMetadataArray(metadata: any): any[] {
    if (!metadata) return [];
    
    return Object.keys(metadata).map(key => ({
      key: key,
      value: metadata[key]
    }));
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return 'None';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  }
}
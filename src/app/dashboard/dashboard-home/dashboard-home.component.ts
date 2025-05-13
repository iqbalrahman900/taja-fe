import { Component, OnInit } from '@angular/core';
import { SongwriterService } from '../../services/songwriter.service';
import { OriginalPublishingService } from '../../services/original-publishing.service';
import { TaggingSongService } from '../../services/tagging-songs.service';
import { CatalogService, SongType, SongTypeStats, StatusCounts } from '../../services/catalog.service';
import { catchError, map, finalize , tap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
  

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
  // Statistics data
  totalSongwriters = 0;
  totalOriginalPublishers = 0;
  totalTaggingSongs = 0;
  
  // Catalog statistics
  totalCommercial = 0;
  totalJingle = 0;
  totalMusicScoring = 0;
  totalMontage = 0;
  
  // Status statistics
  statusCounts: StatusCounts = {
    pending: 0,
    active: 0,
    inactive: 0,
    conflict: 0,

  };

  totalConflictSong = 42;
  totalPendingApprovals = 0; // Will be populated from statusCounts.pending
  
  // Loading states
  loadingStats = false;
  loadingSongwriters = false;
  loadingPublishers = false;
  loadingTaggings = false;
  loadingSongTypes = false;
  loadingStatusCounts = false;
  
  // Last updated timestamp
  lastUpdated: Date = new Date();

  constructor(
    private songwriterService: SongwriterService,
    private originalPublishingService: OriginalPublishingService,
    private taggingSongService: TaggingSongService,
    private catalogService: CatalogService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  refreshData(): void {
    this.loadDashboardData();
    this.toastr.info('Refreshing dashboard data...', 'Refresh');
  }

  loadDashboardData(): void {
    this.loadingStats = true;
    this.lastUpdated = new Date();
    
    // Fetch all statistics in parallel
    forkJoin({
      songwriters: this.getSongwriterStats(),
      publishers: this.getPublisherStats(),
      tags: this.getTaggingStats(),
      songTypes: this.getSongTypeStats(),
      statusCounts: this.getStatusCounts()
    }).subscribe({
      next: (results) => {
        this.totalSongwriters = results.songwriters;
        this.totalOriginalPublishers = results.publishers;
        this.totalTaggingSongs = results.tags;
        
        // Use the stats endpoint results instead of the individual counts
        this.totalCommercial = results.songTypes.commercial;
        this.totalJingle = results.songTypes.jingles;
        this.totalMusicScoring = results.songTypes.scoring;
        this.totalMontage = results.songTypes.montage;
        
        // Set status counts and update pending approvals
        this.statusCounts = results.statusCounts;
        this.totalPendingApprovals = this.statusCounts.pending;
        this.totalConflictSong = this.statusCounts.conflict; 
        
        this.loadingStats = false;
      },
      error: (error) => {
        console.error('Error loading dashboard statistics:', error);
        this.toastr.error('Failed to load dashboard statistics', 'Error');
        this.loadingStats = false;
      }
    });
  }

  private getSongwriterStats() {
    this.loadingSongwriters = true;
    return this.songwriterService.getSongwriters(1, 1).pipe(
      finalize(() => this.loadingSongwriters = false),
      catchError(error => {
        console.error('Error loading songwriter count:', error);
        return of({ data: [], total: 0 });
      }),
      map(response => response.total)
    );
  }

  private getPublisherStats() {
    this.loadingPublishers = true;
    return this.originalPublishingService.getOriginalPublishings(1, 1).pipe(
      finalize(() => this.loadingPublishers = false),
      catchError(error => {
        console.error('Error loading publisher count:', error);
        return of({ data: [], total: 0 });
      }),
      map(response => response.total)
    );
  }

  private getTaggingStats() {
    this.loadingTaggings = true;
    return this.taggingSongService.getTaggingSongs(1, 1).pipe(
      finalize(() => this.loadingTaggings = false),
      catchError(error => {
        console.error('Error loading tag count:', error);
        return of({ data: [], total: 0 });
      }),
      map(response => response.total)
    );
  }

  private getSongTypeStats() {
    this.loadingSongTypes = true;
    return this.catalogService.getSongTypeStats().pipe(
      finalize(() => this.loadingSongTypes = false),
      catchError(error => {
        console.error('Error loading song type stats:', error);
        return of({ commercial: 0, jingles: 0, scoring: 0, montage: 0 });
      })
    );
  }

  private getStatusCounts() {
    this.loadingStatusCounts = true;
    return this.catalogService.getStatusCounts().pipe(
      tap(response => {
        console.log('Status counts API response:', response);
        // Check if conflict property exists
        if (response.hasOwnProperty('conflict')) {
          console.log('Conflict count in response:', response.conflict);
        } else {
          console.log('Conflict property is missing from response!');
        }
      }),
      finalize(() => {
        this.loadingStatusCounts = false;
        console.log('Final status counts object:', this.statusCounts);
      }),
      catchError(error => {
        console.error('Error loading status counts:', error);
        return of({ pending: 0, active: 0, inactive: 0, conflict: 0 });
      })
    );
  }
}
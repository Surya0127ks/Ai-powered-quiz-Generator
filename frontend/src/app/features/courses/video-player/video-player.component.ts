import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VideoService } from '../../../core/services/video.service';
import { UserVideoProgress, VideoMetadata } from '../../../core/models/video.model';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="video-container">
      <header class="video-header">
        <a routerLink="/courses" class="back-link">← Back to Course</a>
        <div class="header-info">
          <h2>Lesson Video Stream & Progress Tracking</h2>
          @if (userProgress()) {
            <div class="completion-pill" [class.completed]="userProgress()?.isCompleted">
              {{ userProgress()?.isCompleted ? '✓ Completed' : userProgress()?.progressPercentage + '% Watched' }}
            </div>
          }
        </div>
      </header>

      <div class="player-wrapper glass-panel">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div> Loading video stream...
          </div>
        } @else if (videoMetadata()) {
          <div class="video-frame-container">
            <video
              #videoRef
              class="video-element"
              [src]="videoMetadata()?.playbackUrl"
              (timeupdate)="onTimeUpdate()"
              (loadedmetadata)="onLoadedMetadata()"
              (ended)="onVideoEnded()"
              controls
              controlsList="nodownload"
            >
              Your browser does not support HTML5 video playback.
            </video>
          </div>

          <!-- Video Controls & Metadata Bar -->
          <div class="player-controls-bar">
            <div class="control-left">
              <span class="provider-badge">{{ videoMetadata()?.provider === 1 ? 'Cloudinary HD' : 'Streaming HD' }}</span>
              <span class="resolution-badge">{{ videoMetadata()?.resolution || '1080p' }}</span>
            </div>

            <div class="control-right">
              <label>Speed:</label>
              <select (change)="changePlaybackSpeed($event)" class="speed-selector">
                <option value="0.75">0.75x</option>
                <option value="1.0" selected>1.0x (Normal)</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2.0">2.0x</option>
              </select>
            </div>
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">🎬</div>
            <h3>No Video Available</h3>
            <p>This lesson does not have a video stream configured yet.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .video-container { padding: 2rem 1.5rem; max-width: 1200px; margin: 0 auto; color: #f8fafc; }
    .video-header { margin-bottom: 1.5rem; }
    .back-link { color: #38bdf8; text-decoration: none; font-size: 0.875rem; margin-bottom: 0.5rem; display: inline-block; }
    .header-info { display: flex; justify-content: space-between; align-items: center; h2 { font-size: 1.5rem; margin: 0; } }
    .completion-pill { padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 700; font-size: 0.8rem; background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); }
    .completion-pill.completed { background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.4); }
    .glass-panel { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; overflow: hidden; }
    .video-frame-container { position: relative; width: 100%; background: #000; aspect-ratio: 16/9; }
    .video-element { width: 100%; height: 100%; object-fit: contain; }
    .player-controls-bar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: rgba(15, 23, 42, 0.9); }
    .control-left { display: flex; gap: 0.5rem; }
    .provider-badge, .resolution-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-weight: 600; }
    .control-right { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #94a3b8; }
    .speed-selector { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.15); color: #f8fafc; padding: 0.35rem 0.65rem; border-radius: 0.375rem; outline: none; }
    .loading-state, .empty-state { padding: 4rem 2rem; text-align: center; color: #94a3b8; }
    .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
  `]
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  private readonly videoService = inject(VideoService);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('videoRef') videoRef!: ElementRef<HTMLVideoElement>;

  readonly videoMetadata = this.videoService.currentVideo;
  readonly userProgress = this.videoService.userProgress;
  readonly isLoading = signal(true);

  lessonId!: string;
  private progressInterval: any;
  private hasResumedPosition = false;

  ngOnInit(): void {
    this.lessonId = this.route.snapshot.paramMap.get('id') || '';
    if (this.lessonId) {
      this.loadVideoData();
    }
  }

  ngOnDestroy(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    this.syncProgressToBackend();
  }

  loadVideoData(): void {
    this.isLoading.set(true);
    this.videoService.getVideoMetadata(this.lessonId).subscribe({
      next: () => {
        this.videoService.getVideoProgress(this.lessonId).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.startProgressSyncTimer();
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  onLoadedMetadata(): void {
    const prog = this.userProgress();
    if (prog && prog.lastWatchedPositionSeconds > 0 && !this.hasResumedPosition && this.videoRef) {
      this.videoRef.nativeElement.currentTime = prog.lastWatchedPositionSeconds;
      this.hasResumedPosition = true;
    }
  }

  onTimeUpdate(): void {
    // Progress tracked dynamically
  }

  onVideoEnded(): void {
    this.syncProgressToBackend(true);
  }

  changePlaybackSpeed(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.videoRef && target) {
      this.videoRef.nativeElement.playbackRate = parseFloat(target.value);
    }
  }

  private startProgressSyncTimer(): void {
    this.progressInterval = setInterval(() => {
      this.syncProgressToBackend();
    }, 5000); // Auto-sync watching progress every 5 seconds
  }

  private syncProgressToBackend(forceCompleted = false): void {
    if (!this.videoRef || !this.videoRef.nativeElement) return;
    const video = this.videoRef.nativeElement;
    const pos = Math.floor(video.currentTime);
    const duration = Math.floor(video.duration) || this.videoMetadata()?.durationSeconds || 0;

    if (duration > 0 && pos >= 0) {
      const positionToSync = forceCompleted ? duration : pos;
      this.videoService.updateVideoProgress(this.lessonId, {
        positionSeconds: positionToSync,
        totalDurationSeconds: duration
      }).subscribe();
    }
  }
}

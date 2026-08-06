import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UpdateVideoProgressRequest, UserVideoProgress, VideoMetadata } from '../models/video.model';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/lessons';

  readonly currentVideo = signal<VideoMetadata | null>(null);
  readonly userProgress = signal<UserVideoProgress | null>(null);

  getVideoMetadata(lessonId: string): Observable<VideoMetadata> {
    return this.http.get<VideoMetadata>(`${this.baseUrl}/${lessonId}/video`).pipe(
      tap(video => this.currentVideo.set(video))
    );
  }

  getVideoProgress(lessonId: string): Observable<UserVideoProgress> {
    return this.http.get<UserVideoProgress>(`${this.baseUrl}/${lessonId}/progress`).pipe(
      tap(prog => this.userProgress.set(prog))
    );
  }

  updateVideoProgress(lessonId: string, request: UpdateVideoProgressRequest): Observable<UserVideoProgress> {
    return this.http.post<UserVideoProgress>(`${this.baseUrl}/${lessonId}/progress`, request).pipe(
      tap(prog => this.userProgress.set(prog))
    );
  }
}

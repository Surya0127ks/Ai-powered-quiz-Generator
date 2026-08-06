import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { StudentProgressSummary } from '../models/progress.model';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/progress';

  readonly summary = signal<StudentProgressSummary | null>(null);

  getProgressSummary(): Observable<StudentProgressSummary> {
    return this.http.get<StudentProgressSummary>(`${this.baseUrl}/summary`).pipe(
      tap(data => this.summary.set(data))
    );
  }

  toggleLessonCompletion(lessonId: string, isCompleted: boolean): Observable<{ lessonId: string; isCompleted: boolean }> {
    return this.http.post<{ lessonId: string; isCompleted: boolean }>(`${this.baseUrl}/lessons/${lessonId}/toggle`, isCompleted);
  }
}

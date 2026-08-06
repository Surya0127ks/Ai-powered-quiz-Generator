import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { InstructorDashboardSummary } from '../models/instructor.model';

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/instructor';

  readonly dashboardSummary = signal<InstructorDashboardSummary | null>(null);

  getDashboardSummary(): Observable<InstructorDashboardSummary> {
    return this.http.get<InstructorDashboardSummary>(`${this.baseUrl}/dashboard/summary`).pipe(
      tap(summary => this.dashboardSummary.set(summary))
    );
  }
}

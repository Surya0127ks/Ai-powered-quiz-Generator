import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentDashboardSummary } from '../models/student.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/student';

  getDashboardSummary(): Observable<StudentDashboardSummary> {
    return this.http.get<StudentDashboardSummary>(`${this.apiUrl}/dashboard/summary`);
  }
}

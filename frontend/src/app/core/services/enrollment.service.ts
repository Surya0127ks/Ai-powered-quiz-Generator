import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CourseAccess, Enrollment } from '../models/enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  readonly myEnrollments = signal<Enrollment[]>([]);

  enroll(courseId: string): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.baseUrl}/courses/${courseId}/enroll`, {});
  }

  unenroll(courseId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/courses/${courseId}/unenroll`);
  }

  getMyEnrollments(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.baseUrl}/enrollments/my-courses`).pipe(
      tap(enrollments => this.myEnrollments.set(enrollments))
    );
  }

  checkCourseAccess(courseId: string): Observable<CourseAccess> {
    return this.http.get<CourseAccess>(`${this.baseUrl}/courses/${courseId}/access`);
  }
}

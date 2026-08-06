import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Assignment, AssignmentSubmission, SubmitAssignmentRequest } from '../models/assignment.model';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  readonly currentAssignment = signal<Assignment | null>(null);

  getAssignmentByLesson(lessonId: string): Observable<Assignment> {
    return this.http.get<Assignment>(`${this.baseUrl}/lessons/${lessonId}/assignment`).pipe(
      tap(assignment => this.currentAssignment.set(assignment))
    );
  }

  submitAssignment(assignmentId: string, request: SubmitAssignmentRequest): Observable<AssignmentSubmission> {
    return this.http.post<AssignmentSubmission>(`${this.baseUrl}/assignments/${assignmentId}/submit`, request);
  }
}

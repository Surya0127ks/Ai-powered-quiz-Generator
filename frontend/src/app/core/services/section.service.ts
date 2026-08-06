import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CreateLessonRequest, CreateSectionRequest, Lesson, Section } from '../models/section.model';

@Injectable({
  providedIn: 'root'
})
export class SectionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  readonly sections = signal<Section[]>([]);

  getSectionsByCourse(courseId: string): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.baseUrl}/courses/${courseId}/sections`).pipe(
      tap(secs => this.sections.set(secs))
    );
  }

  createSection(courseId: string, request: CreateSectionRequest): Observable<Section> {
    return this.http.post<Section>(`${this.baseUrl}/courses/${courseId}/sections`, request);
  }

  deleteSection(sectionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/sections/${sectionId}`);
  }

  createLesson(sectionId: string, request: CreateLessonRequest): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.baseUrl}/sections/${sectionId}/lessons`, request);
  }

  updateLesson(lessonId: string, request: CreateLessonRequest): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.baseUrl}/lessons/${lessonId}`, request);
  }

  deleteLesson(lessonId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/lessons/${lessonId}`);
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Category, Course, CourseFilterParams, CourseSummary, CreateCourseRequest, PagedResult } from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/courses';
  private readonly categoriesUrl = '/api/v1/categories';

  // State Signals
  readonly categories = signal<Category[]>([]);
  readonly courses = signal<CourseSummary[]>([]);
  readonly totalCount = signal<number>(0);
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(0);

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoriesUrl).pipe(
      tap(cats => this.categories.set(cats))
    );
  }

  getCourses(filter: CourseFilterParams = {}): Observable<PagedResult<CourseSummary>> {
    let params = new HttpParams();

    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.categoryId) params = params.set('categoryId', filter.categoryId);
    if (filter.level !== undefined && filter.level !== null) params = params.set('level', filter.level.toString());
    if (filter.language) params = params.set('language', filter.language);
    if (filter.status !== undefined && filter.status !== null) params = params.set('status', filter.status.toString());
    if (filter.minPrice !== undefined && filter.minPrice !== null) params = params.set('minPrice', filter.minPrice.toString());
    if (filter.maxPrice !== undefined && filter.maxPrice !== null) params = params.set('maxPrice', filter.maxPrice.toString());
    if (filter.isFree !== undefined && filter.isFree !== null) params = params.set('isFree', filter.isFree.toString());
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortDescending !== undefined) params = params.set('sortDescending', filter.sortDescending.toString());
    if (filter.pageNumber) params = params.set('pageNumber', filter.pageNumber.toString());
    if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());

    return this.http.get<PagedResult<CourseSummary>>(this.baseUrl, { params }).pipe(
      tap(res => {
        this.courses.set(res.items);
        this.totalCount.set(res.totalCount);
        this.pageNumber.set(res.pageNumber);
        this.pageSize.set(res.pageSize);
        this.totalPages.set(res.totalPages);
      })
    );
  }

  getCourseById(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/${id}`);
  }

  createCourse(request: CreateCourseRequest): Observable<Course> {
    return this.http.post<Course>(this.baseUrl, request);
  }

  updateCourse(id: string, request: CreateCourseRequest): Observable<Course> {
    return this.http.put<Course>(`${this.baseUrl}/${id}`, request);
  }

  changeStatus(id: string, status: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}/status`, status);
  }

  deleteCourse(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}

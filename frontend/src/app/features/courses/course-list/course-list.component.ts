import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Category, CourseFilterParams, CourseLevel, CourseStatus, CourseSummary } from '../../../core/models/course.model';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="course-page-container">
      <!-- Page Header -->
      <header class="page-header saas-card">
        <div>
          <span class="badge badge-emerald">📚 Catalog & Course Management</span>
          <h1>Course Catalog & Directory</h1>
          <p>Explore, filter, and manage training courses across your enterprise organization</p>
        </div>
        <a routerLink="/courses/new" class="btn btn-primary">
          <span>+</span> Create New Course
        </a>
      </header>

      <!-- Search & Filters Toolbar -->
      <div class="toolbar saas-card">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange()"
            placeholder="Search courses by title, topic, or description..."
            class="input-control search-input"
          />
        </div>

        <div class="filters-row">
          <select [(ngModel)]="selectedCategory" (change)="loadCourses()" class="input-control">
            <option value="">All Categories</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>

          <select [(ngModel)]="selectedLevel" (change)="loadCourses()" class="input-control">
            <option [value]="null">All Skill Levels</option>
            <option [value]="CourseLevel.Beginner">Beginner</option>
            <option [value]="CourseLevel.Intermediate">Intermediate</option>
            <option [value]="CourseLevel.Advanced">Advanced</option>
            <option [value]="CourseLevel.AllLevels">All Levels</option>
          </select>

          <select [(ngModel)]="selectedStatus" (change)="loadCourses()" class="input-control">
            <option [value]="null">All Statuses</option>
            <option [value]="CourseStatus.Draft">Draft</option>
            <option [value]="CourseStatus.Published">Published</option>
            <option [value]="CourseStatus.Archived">Archived</option>
          </select>

          <select [(ngModel)]="sortBy" (change)="loadCourses()" class="input-control">
            <option value="CreatedAt">Sort by Newest</option>
            <option value="Title">Sort by Title</option>
            <option value="Price">Sort by Price</option>
          </select>
        </div>
      </div>

      <!-- Course Cards Grid -->
      @if (isLoading()) {
        <div class="loading-state saas-card">
          <div class="spinner"></div> Loading courses catalog...
        </div>
      } @else if (courses().length === 0) {
        <div class="empty-state saas-card">
          <div class="empty-icon">📚</div>
          <h3>No Courses Found</h3>
          <p>Try adjusting your search criteria or create a new course.</p>
        </div>
      } @else {
        <div class="course-grid">
          @for (course of courses(); track course.id) {
            <div class="course-card saas-card saas-card-hover">
              <div class="card-thumb">
                <img [src]="course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80'" [alt]="course.title" />
                <span class="status-badge" [class]="getStatusClass(course.status)">
                  {{ getStatusText(course.status) }}
                </span>
                <span class="price-tag" [class.free]="course.isFree">
                  {{ course.isFree ? 'FREE' : ('$' + course.price) }}
                </span>
              </div>

              <div class="card-body">
                <span class="category-pill">{{ course.categoryName || 'General Training' }}</span>
                <h3 class="course-title">{{ course.title }}</h3>
                <p class="course-desc">{{ course.shortDescription }}</p>

                <div class="course-meta">
                  <span class="meta-item">📊 {{ getLevelText(course.level) }}</span>
                  <span class="meta-item">🌐 {{ course.language }}</span>
                </div>
              </div>

              <div class="card-actions">
                <a [routerLink]="['/courses', course.id, 'curriculum']" class="btn-action curriculum">Curriculum</a>
                <a [routerLink]="['/courses', course.id, 'edit']" class="btn-action edit">Edit</a>
                <button (click)="toggleStatus(course)" class="btn-action status">
                  {{ course.status === CourseStatus.Published ? 'Archive' : 'Publish' }}
                </button>
                <button (click)="deleteCourse(course.id)" class="btn-action delete">Delete</button>
              </div>
            </div>
          }
        </div>

        <!-- Pagination Bar -->
        <div class="pagination-bar saas-card margin-top">
          <span>Showing {{ courses().length }} of {{ totalCount() }} catalog courses</span>
          <div class="page-controls">
            <button
              [disabled]="pageNumber() <= 1"
              (click)="changePage(pageNumber() - 1)"
              class="btn btn-outline btn-sm"
            >
              ← Previous
            </button>
            <span class="page-indicator">Page {{ pageNumber() }} of {{ totalPages() }}</span>
            <button
              [disabled]="pageNumber() >= totalPages()"
              (click)="changePage(pageNumber() + 1)"
              class="btn btn-outline btn-sm"
            >
              Next →
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .course-page-container {
      padding: 2.25rem 1.5rem;
      max-width: 1260px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1.75rem;
      background: linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%);
      border: 1.5px solid #a7f3d0;
      h1 { font-size: 2.0rem; font-weight: 800; color: #0f172a !important; margin: 0.35rem 0 0 0; }
      p { color: #475569 !important; margin-top: 0.25rem; font-size: 0.95rem; }
    }

    .toolbar {
      padding: 1.35rem;
      margin-bottom: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.0rem;
    }
    .search-box {
      position: relative;
      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        font-size: 0.9rem;
      }
      .search-input {
        padding-left: 2.6rem !important;
      }
    }
    .filters-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 1.0rem;
    }

    .course-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .course-card {
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .card-thumb {
      position: relative;
      height: 180px;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .status-badge {
        position: absolute;
        top: 0.75rem;
        left: 0.75rem;
        padding: 0.25rem 0.65rem;
        border-radius: 9999px;
        font-size: 0.725rem;
        font-weight: 800;
        text-transform: uppercase;
        &.draft { background: #f1f5f9; color: #475569 !important; border: 1px solid #cbd5e1; }
        &.published { background: #ecfdf5; color: #047857 !important; border: 1px solid #a7f3d0; }
        &.archived { background: #fef2f2; color: #dc2626 !important; border: 1px solid #fecaca; }
      }
      .price-tag {
        position: absolute;
        bottom: 0.75rem;
        right: 0.75rem;
        background: #ffffff;
        color: #0f172a !important;
        padding: 0.25rem 0.7rem;
        border-radius: 0.375rem;
        font-weight: 800;
        font-size: 0.825rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 4px rgba(15, 23, 42, 0.08);
        &.free { color: #059669 !important; background: #ecfdf5; border-color: #a7f3d0; }
      }
    }
    .card-body {
      padding: 1.25rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      .category-pill {
        display: inline-block;
        background: #ecfdf5;
        color: #047857 !important;
        font-size: 0.725rem;
        font-weight: 800;
        padding: 0.2rem 0.55rem;
        border-radius: 0.25rem;
        margin-bottom: 0.4rem;
        align-self: flex-start;
        border: 1px solid #a7f3d0;
        text-transform: uppercase;
      }
      .course-title {
        font-size: 1.1rem;
        font-weight: 800;
        color: #0f172a !important;
        margin-bottom: 0.35rem;
        line-height: 1.35;
      }
      .course-desc {
        color: #475569 !important;
        font-size: 0.85rem;
        line-height: 1.45;
        margin-bottom: 1rem;
        flex-grow: 1;
      }
      .course-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: #64748b !important;
        font-weight: 600;
      }
    }
    .card-actions {
      display: flex;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      .btn-action {
        flex: 1;
        background: none;
        border: none;
        border-right: 1px solid #e2e8f0;
        &:last-child { border-right: none; }
        padding: 0.7rem 0.4rem;
        font-size: 0.775rem;
        font-weight: 700;
        cursor: pointer;
        color: #334155 !important;
        transition: background 0.15s;
        text-align: center;
        text-decoration: none;
        &:hover { background: #e2e8f0; }
        &.delete { color: #dc2626 !important; &:hover { background: #fef2f2; } }
      }
    }

    .margin-top { margin-top: 1.75rem; }
    .pagination-bar {
      padding: 1.0rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      color: #64748b !important;
      font-weight: 600;
    }
    .page-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .page-indicator { font-weight: 700; color: #0f172a !important; }
    .empty-state { text-align: center; padding: 4rem 2rem; color: #64748b !important; .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; } }
    .loading-state { text-align: center; padding: 4rem; color: #64748b !important; }
  `]
})
export class CourseListComponent implements OnInit {
  private readonly courseService = inject(CourseService);

  readonly CourseLevel = CourseLevel;
  readonly CourseStatus = CourseStatus;

  readonly courses = this.courseService.courses;
  readonly categories = this.courseService.categories;
  readonly totalCount = this.courseService.totalCount;
  readonly pageNumber = this.courseService.pageNumber;
  readonly totalPages = this.courseService.totalPages;
  readonly isLoading = signal(false);

  searchTerm = '';
  selectedCategory = '';
  selectedLevel: CourseLevel | null = null;
  selectedStatus: CourseStatus | null = null;
  sortBy = 'CreatedAt';

  ngOnInit(): void {
    this.courseService.getCategories().subscribe();
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading.set(true);

    const filter: CourseFilterParams = {
      searchTerm: this.searchTerm || undefined,
      categoryId: this.selectedCategory || undefined,
      level: this.selectedLevel !== null ? this.selectedLevel : undefined,
      status: this.selectedStatus !== null ? this.selectedStatus : undefined,
      sortBy: this.sortBy,
      pageNumber: this.pageNumber(),
      pageSize: 9
    };

    this.courseService.getCourses(filter).subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  onSearchChange(): void {
    this.loadCourses();
  }

  changePage(page: number): void {
    this.courseService.pageNumber.set(page);
    this.loadCourses();
  }

  toggleStatus(course: CourseSummary): void {
    const newStatus = course.status === CourseStatus.Published ? CourseStatus.Archived : CourseStatus.Published;
    this.courseService.changeStatus(course.id, newStatus).subscribe(() => this.loadCourses());
  }

  deleteCourse(id: string): void {
    if (confirm('Are you sure you want to soft delete this course?')) {
      this.courseService.deleteCourse(id).subscribe(() => this.loadCourses());
    }
  }

  getStatusClass(status: CourseStatus): string {
    switch (status) {
      case CourseStatus.Published: return 'published';
      case CourseStatus.Archived: return 'archived';
      default: return 'draft';
    }
  }

  getStatusText(status: CourseStatus): string {
    switch (status) {
      case CourseStatus.Published: return 'Published';
      case CourseStatus.Archived: return 'Archived';
      default: return 'Draft';
    }
  }

  getLevelText(level: CourseLevel): string {
    switch (level) {
      case CourseLevel.Beginner: return 'Beginner';
      case CourseLevel.Intermediate: return 'Intermediate';
      case CourseLevel.Advanced: return 'Advanced';
      default: return 'All Skill Levels';
    }
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { Enrollment, EnrollmentStatus } from '../../../core/models/enrollment.model';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="my-courses-container">
      <header class="page-header saas-card">
        <div>
          <span class="badge badge-emerald">📖 Active Learning Workspace</span>
          <h1>My Enrolled Courses</h1>
          <p>Track your active learning journey, lesson completion percentages, and certificates</p>
        </div>
        <a routerLink="/courses" class="btn btn-primary">+ Browse Catalog</a>
      </header>

      @if (isLoading()) {
        <div class="loading-state saas-card">
          <div class="spinner"></div> Loading your active enrollments...
        </div>
      } @else if (enrollments().length === 0) {
        <div class="empty-state saas-card">
          <div class="empty-icon">🎓</div>
          <h3>No Enrolled Courses Yet</h3>
          <p>Explore our course catalog and enroll to start learning today!</p>
          <a routerLink="/courses" class="btn btn-primary margin-top">Explore Catalog Courses</a>
        </div>
      } @else {
        <div class="courses-grid">
          @for (item of enrollments(); track item.id) {
            <div class="course-card saas-card saas-card-hover">
              <div class="card-thumbnail">
                <img [src]="item.courseThumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80'" [alt]="item.courseTitle" />
                <span class="status-badge" [class.completed]="item.status === EnrollmentStatus.Completed">
                  {{ item.status === EnrollmentStatus.Completed ? '✓ Completed' : 'In Progress' }}
                </span>
              </div>

              <div class="card-body">
                <h3>{{ item.courseTitle }}</h3>
                <span class="enrolled-date">Enrolled on {{ item.enrolledAtUtc | date:'mediumDate' }}</span>

                <!-- Progress Bar -->
                <div class="progress-section">
                  <div class="progress-label">
                    <span>Course Progress</span>
                    <span class="progress-percent">{{ item.progressPercentage }}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" [style.width.%]="item.progressPercentage"></div>
                  </div>
                  <span class="lessons-count">{{ item.completedLessonsCount }} of {{ item.totalLessonsCount }} lessons completed</span>
                </div>
              </div>

              <div class="card-footer">
                @if (item.status === EnrollmentStatus.Completed) {
                  <a [routerLink]="['/courses', item.courseId, 'certificate']" class="btn btn-outline btn-sm">🎓 Certificate</a>
                } @else {
                  <a [routerLink]="['/courses', item.courseId, 'curriculum']" class="btn btn-primary btn-sm">
                    Continue Learning →
                  </a>
                }
                <button (click)="unenroll(item.courseId)" class="btn-unenroll">Unenroll</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .my-courses-container { padding: 2.25rem 1.5rem; max-width: 1260px; margin: 0 auto; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%);
      border: 1.5px solid var(--color-primary-200);
      h1 { font-size: 2.0rem; font-weight: 800; color: var(--color-neutral-900) !important; margin: 0.35rem 0 0 0; }
      p { color: var(--color-neutral-600) !important; margin-top: 0.25rem; font-size: 0.95rem; }
    }
    .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    .course-card { display: flex; flex-direction: column; justify-content: space-between; padding: 0; overflow: hidden; }
    .card-thumbnail { position: relative; width: 100%; aspect-ratio: 16/9; img { width: 100%; height: 100%; object-fit: cover; } }
    .status-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background: #ffffff;
      color: var(--color-primary-700) !important;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      border: 1px solid var(--color-primary-200);
      box-shadow: var(--shadow-sm);
    }
    .status-badge.completed { background: #d1fae5; color: #047857 !important; border-color: #6ee7b7; }
    .card-body { padding: 1.25rem; h3 { font-size: 1.1rem; font-weight: 800; color: var(--color-neutral-900) !important; margin: 0 0 0.35rem 0; line-height: 1.35; } }
    .enrolled-date { font-size: 0.775rem; color: var(--color-neutral-500) !important; display: block; margin-bottom: 1rem; }
    .progress-section { display: flex; flex-direction: column; gap: 0.35rem; }
    .progress-label { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; color: var(--color-neutral-700) !important; }
    .progress-percent { font-weight: 800; color: var(--color-primary-600) !important; }
    .progress-track { height: 7px; background: var(--color-neutral-200); border-radius: 9999px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--color-primary-600); border-radius: 9999px; }
    .lessons-count { font-size: 0.75rem; color: var(--color-neutral-500) !important; margin-top: 0.2rem; }
    .card-footer { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: var(--color-neutral-50); border-top: 1px solid var(--color-neutral-200); }
    .btn-unenroll { background: none; border: none; color: #dc2626; font-size: 0.775rem; font-weight: 700; cursor: pointer; text-decoration: underline; opacity: 0.85; &:hover { opacity: 1; } }
    .loading-state, .empty-state { padding: 4rem 2rem; text-align: center; color: var(--color-neutral-500) !important; }
    .empty-icon { font-size: 3.5rem; margin-bottom: 0.5rem; }
    .margin-top { margin-top: 1rem; }
  `]
})
export class MyCoursesComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  readonly EnrollmentStatus = EnrollmentStatus;
  readonly enrollments = this.enrollmentService.myEnrollments;
  readonly isLoading = signal(false);

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.enrollmentService.getMyEnrollments().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  unenroll(courseId: string): void {
    if (confirm('Are you sure you want to unenroll from this course?')) {
      this.enrollmentService.unenroll(courseId).subscribe(() => this.loadEnrollments());
    }
  }
}

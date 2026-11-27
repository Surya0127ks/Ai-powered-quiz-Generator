import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { InstructorService } from '../../../core/services/instructor.service';
import { CourseStatus } from '../../../core/models/course.model';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header white-card">
        <div class="header-title">
          <span class="pill-badge">👨‍🏫 Educator & Quiz Creator Suite</span>
          <h1>Instructor & Quiz Portal</h1>
          <p>Create quizzes, share test links with your students, build courses, and track student scores.</p>
        </div>
        <div class="header-actions">
          <button (click)="onCreateQuickQuiz()" class="btn btn-primary">
            📝 Create Quiz / Test Link
          </button>
          <a routerLink="/courses/new" class="btn btn-outline">
            📚 Create Full Course
          </a>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading-state white-card">
          <div class="spinner"></div> Loading educator portal & analytics...
        </div>
      } @else if (summary()) {
        <!-- Key Metrics Cards Grid -->
        <div class="metrics-grid">
          <div class="metric-card white-card">
            <div class="metric-icon blue">📝</div>
            <div class="metric-info">
              <span class="metric-value">{{ summary()?.totalCourses }}</span>
              <span class="metric-label">Quizzes & Courses Created</span>
              <span class="metric-sub">{{ summary()?.publishedCoursesCount }} Published | {{ summary()?.draftCoursesCount }} Draft</span>
            </div>
          </div>

          <div class="metric-card white-card">
            <div class="metric-icon green">👥</div>
            <div class="metric-info">
              <span class="metric-value">{{ summary()?.totalEnrolledStudents }}</span>
              <span class="metric-label">Active Students</span>
              <span class="metric-sub">{{ summary()?.totalCompletedEnrollments }} Test & Course Completions</span>
            </div>
          </div>

          <div class="metric-card white-card">
            <div class="metric-icon purple">🎯</div>
            <div class="metric-info">
              <span class="metric-value">{{ summary()?.averageCompletionRate }}%</span>
              <span class="metric-label">Avg. Completion Rate</span>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="summary()?.averageCompletionRate"></div>
              </div>
            </div>
          </div>

          <div class="metric-card white-card">
            <div class="metric-icon gold">💰</div>
            <div class="metric-info">
              <span class="metric-value">\${{ summary()?.totalEarnings | number:'1.2-2' }}</span>
              <span class="metric-label">Total Revenue</span>
              <span class="metric-sub">Aggregated Enrollments</span>
            </div>
          </div>
        </div>

        <!-- Quizzes & Courses List Table -->
        <div class="table-card white-card margin-top">
          <div class="card-header">
            <div>
              <h3>Your Quizzes & Courses</h3>
              <p class="sub-text">Manage questions, copy shareable test links for students, and update settings</p>
            </div>
            <a routerLink="/courses" class="view-all-link">View Full Catalog →</a>
          </div>

          @if (summary()?.recentCourses?.length === 0) {
            <div class="empty-courses">
              <span class="empty-icon">📝</span>
              <p>You haven't created any quizzes or courses yet.</p>
              <div class="empty-actions">
                <button (click)="onCreateQuickQuiz()" class="btn btn-primary">Create Your First Quiz</button>
                <a routerLink="/courses/new" class="btn btn-outline">Create a Course</a>
              </div>
            </div>
          } @else {
            <div class="table-wrapper">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Quiz / Course Title</th>
                    <th>Category</th>
                    <th>Access Price</th>
                    <th>Enrolled Students</th>
                    <th>Completion Rate</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of summary()?.recentCourses; track c.courseId) {
                    <tr>
                      <td class="font-bold">{{ c.title }}</td>
                      <td><span class="category-pill">{{ c.categoryName }}</span></td>
                      <td>{{ c.price === 0 ? 'Free' : ('$' + c.price) }}</td>
                      <td><strong>{{ c.totalEnrolledStudents }}</strong> students</td>
                      <td>
                        <div class="rate-cell">
                          <span>{{ c.completionRate }}%</span>
                          <div class="mini-bar-track">
                            <div class="mini-bar-fill" [style.width.%]="c.completionRate"></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="status-badge" [class.published]="c.status === CourseStatus.Published">
                          {{ c.status === CourseStatus.Published ? 'Published' : 'Draft' }}
                        </span>
                      </td>
                      <td>
                        <div class="table-actions">
                          <a [routerLink]="['/courses', c.courseId, 'curriculum']" class="btn-sm btn-primary-sm">
                            📝 Manage Quiz / Curriculum
                          </a>
                          <a [routerLink]="['/courses', c.courseId, 'edit']" class="btn-sm btn-subtle">Settings</a>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container { max-width: 1280px; margin: 0 auto; padding: 2.5rem 1.5rem; }
    .white-card {
      background: var(--bg-card);
      border: 1px solid var(--border-hairline);
      border-radius: 1rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }
    .dashboard-header {
      padding: 2.25rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      border-left: 4px solid var(--color-primary-600);
    }
    .pill-badge {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--color-primary-600);
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      display: inline-block;
      margin-bottom: 0.65rem;
    }
    .header-title h1 { font-size: 2rem; font-weight: 800; color: var(--text-primary) !important; margin: 0; }
    .header-title p { color: var(--text-secondary) !important; margin-top: 0.35rem; font-size: 0.95rem; font-weight: 500; }
    .header-actions { display: flex; gap: 0.85rem; }
    
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
    .metric-card { padding: 1.35rem 1.5rem; display: flex; gap: 1.1rem; align-items: center; }
    .metric-icon { width: 50px; height: 50px; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
    .metric-icon.blue { background: var(--color-primary-50); color: var(--color-primary-600); border: 1px solid var(--color-primary-200); }
    .metric-icon.green { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success-border); }
    .metric-icon.purple { background: var(--color-ai-bg); color: var(--color-ai-purple); border: 1px solid var(--color-ai-border); }
    .metric-icon.gold { background: var(--color-warning-bg); color: var(--color-warning); border: 1px solid var(--color-warning-border); }
    
    .metric-info { display: flex; flex-direction: column; width: 100%; }
    .metric-value { font-size: 1.65rem; font-weight: 800; color: var(--text-primary) !important; line-height: 1.1; }
    .metric-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted) !important; text-transform: uppercase; margin: 0.25rem 0; }
    .metric-sub { font-size: 0.75rem; color: var(--text-muted) !important; font-weight: 500; }
    .progress-track { height: 6px; background: var(--bg-hover); border-radius: 3px; margin-top: 0.4rem; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--color-ai-purple); border-radius: 3px; }
    
    .margin-top { margin-top: 2.25rem; }
    .table-card { padding: 1.85rem; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; h3 { font-size: 1.25rem; font-weight: 800; color: var(--text-primary) !important; margin: 0; } .sub-text { font-size: 0.85rem; color: var(--text-muted) !important; margin: 0.2rem 0 0 0; } }
    .view-all-link { color: var(--color-primary-600) !important; text-decoration: none; font-size: 0.875rem; font-weight: 800; }
    
    .table-wrapper { overflow-x: auto; }
    .custom-table { width: 100%; border-collapse: collapse; text-align: left; }
    .custom-table th { padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-hairline); color: var(--text-muted) !important; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; }
    .custom-table td { padding: 1rem; border-bottom: 1px solid var(--border-hairline); font-size: 0.9rem; color: var(--text-body) !important; }
    .font-bold { font-weight: 800; color: var(--text-primary) !important; }
    .category-pill { background: var(--bg-hover); padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-size: 0.775rem; font-weight: 700; color: var(--text-body) !important; border: 1px solid var(--border-strong); }
    .rate-cell { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; font-weight: 700; }
    .mini-bar-track { height: 5px; background: var(--bg-hover); border-radius: 2px; width: 90px; overflow: hidden; }
    .mini-bar-fill { height: 100%; background: var(--color-primary-600); }
    .status-badge { padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; background: var(--color-warning-bg); color: var(--color-warning) !important; border: 1px solid var(--color-warning-border); }
    .status-badge.published { background: var(--color-success-bg); color: var(--color-success) !important; border-color: var(--color-success-border); }
    
    .table-actions { display: flex; gap: 0.5rem; }
    .btn { padding: 0.75rem 1.25rem; border-radius: 0.6rem; font-weight: 800; cursor: pointer; border: none; text-decoration: none; font-size: 0.875rem; }
    .btn-primary { background: var(--color-primary-600); color: var(--text-on-primary) !important; box-shadow: var(--shadow-sm); }
    .btn-outline { background: var(--bg-surface); color: var(--text-primary) !important; border: 1px solid var(--border-strong); &:hover { background: var(--bg-hover); } }
    
    .btn-sm { padding: 0.4rem 0.85rem; font-size: 0.8rem; border-radius: 0.5rem; text-decoration: none; font-weight: 800; display: inline-flex; align-items: center; }
    .btn-primary-sm { background: var(--color-primary-50); color: var(--color-primary-600) !important; border: 1px solid var(--color-primary-200); &:hover { background: var(--color-primary-100); } }
    .btn-subtle { background: var(--bg-subtle); color: var(--text-body) !important; border: 1px solid var(--border-strong); &:hover { background: var(--bg-hover); } }
    
    .empty-courses { padding: 3.5rem; text-align: center; color: var(--text-muted) !important; .empty-icon { font-size: 2.25rem; } p { font-weight: 600; font-size: 1rem; margin: 0.5rem 0 1.25rem 0; } }
    .empty-actions { display: flex; gap: 0.85rem; justify-content: center; }
    .loading-state { padding: 4rem; text-align: center; color: var(--text-muted) !important; font-weight: 600; }
    @media (max-width: 760px) {
      .dashboard-container { padding: 1.25rem 1rem; }
      .dashboard-header { padding: 1.5rem; align-items: flex-start; flex-direction: column; gap: 1.25rem; }
      .header-title h1 { font-size: 1.55rem; }
      .header-actions { width: 100%; flex-wrap: wrap; }
      .header-actions .btn { flex: 1 1 180px; text-align: center; }
      .table-card { padding: 1.1rem; }
      .card-header { align-items: flex-start; flex-direction: column; gap: 0.75rem; }
      .empty-courses { padding: 2rem 1rem; }
      .empty-actions { flex-wrap: wrap; }
    }
  `]
})
export class InstructorDashboardComponent implements OnInit {
  private readonly instructorService = inject(InstructorService);
  private readonly router = inject(Router);

  readonly CourseStatus = CourseStatus;
  readonly summary = this.instructorService.dashboardSummary;
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading.set(true);
    this.instructorService.getDashboardSummary().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  onCreateQuickQuiz(): void {
    this.router.navigate(['/quizzes/new']);
  }
}

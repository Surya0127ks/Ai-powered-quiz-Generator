import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { InstructorService } from '../../../core/services/instructor.service';
import { CourseService } from '../../../core/services/course.service';
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
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 1rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }
    .dashboard-header {
      padding: 2.25rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      border-left: 6px solid #2563eb;
    }
    .pill-badge {
      font-size: 0.78rem;
      font-weight: 800;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      display: inline-block;
      margin-bottom: 0.65rem;
    }
    .header-title h1 { font-size: 2rem; font-weight: 800; color: #0f172a !important; margin: 0; }
    .header-title p { color: #475569 !important; margin-top: 0.35rem; font-size: 0.95rem; font-weight: 500; }
    .header-actions { display: flex; gap: 0.85rem; }
    
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
    .metric-card { padding: 1.35rem 1.5rem; display: flex; gap: 1.1rem; align-items: center; }
    .metric-icon { width: 50px; height: 50px; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
    .metric-icon.blue { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .metric-icon.green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .metric-icon.purple { background: #f3e8ff; color: #7c3aed; border: 1px solid #ddd6fe; }
    .metric-icon.gold { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
    
    .metric-info { display: flex; flex-direction: column; width: 100%; }
    .metric-value { font-size: 1.65rem; font-weight: 800; color: #0f172a !important; line-height: 1.1; }
    .metric-label { font-size: 0.8rem; font-weight: 700; color: #64748b !important; text-transform: uppercase; margin: 0.25rem 0; }
    .metric-sub { font-size: 0.75rem; color: #64748b !important; font-weight: 500; }
    .progress-track { height: 6px; background: #e2e8f0; border-radius: 3px; margin-top: 0.4rem; overflow: hidden; }
    .progress-fill { height: 100%; background: #7c3aed; border-radius: 3px; }
    
    .margin-top { margin-top: 2.25rem; }
    .table-card { padding: 1.85rem; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; h3 { font-size: 1.25rem; font-weight: 800; color: #0f172a !important; margin: 0; } .sub-text { font-size: 0.85rem; color: #64748b !important; margin: 0.2rem 0 0 0; } }
    .view-all-link { color: #2563eb !important; text-decoration: none; font-size: 0.875rem; font-weight: 800; }
    
    .table-wrapper { overflow-x: auto; }
    .custom-table { width: 100%; border-collapse: collapse; text-align: left; }
    .custom-table th { padding: 0.85rem 1rem; border-bottom: 1.5px solid #e2e8f0; color: #64748b !important; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; }
    .custom-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155 !important; }
    .font-bold { font-weight: 800; color: #0f172a !important; }
    .category-pill { background: #f1f5f9; padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-size: 0.775rem; font-weight: 700; color: #475569 !important; border: 1px solid #cbd5e1; }
    .rate-cell { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; font-weight: 700; }
    .mini-bar-track { height: 5px; background: #e2e8f0; border-radius: 2px; width: 90px; overflow: hidden; }
    .mini-bar-fill { height: 100%; background: #2563eb; }
    .status-badge { padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; background: #fef3c7; color: #d97706 !important; border: 1px solid #fde68a; }
    .status-badge.published { background: #f0fdf4; color: #16a34a !important; border-color: #bbf7d0; }
    
    .table-actions { display: flex; gap: 0.5rem; }
    .btn { padding: 0.75rem 1.25rem; border-radius: 0.6rem; font-weight: 800; cursor: pointer; border: none; text-decoration: none; font-size: 0.875rem; }
    .btn-primary { background: #2563eb; color: #ffffff !important; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
    .btn-outline { background: #ffffff; color: #0f172a !important; border: 1.5px solid #cbd5e1; &:hover { background: #f8fafc; } }
    
    .btn-sm { padding: 0.4rem 0.85rem; font-size: 0.8rem; border-radius: 0.5rem; text-decoration: none; font-weight: 800; display: inline-flex; align-items: center; }
    .btn-primary-sm { background: #eff6ff; color: #2563eb !important; border: 1.5px solid #bfdbfe; &:hover { background: #dbeafe; } }
    .btn-subtle { background: #f8fafc; color: #334155 !important; border: 1.5px solid #cbd5e1; &:hover { background: #f1f5f9; } }
    
    .empty-courses { padding: 3.5rem; text-align: center; color: #64748b !important; .empty-icon { font-size: 2.25rem; } p { font-weight: 600; font-size: 1rem; margin: 0.5rem 0 1.25rem 0; } }
    .empty-actions { display: flex; gap: 0.85rem; justify-content: center; }
    .loading-state { padding: 4rem; text-align: center; color: #64748b !important; font-weight: 600; }
  `]
})
export class InstructorDashboardComponent implements OnInit {
  private readonly instructorService = inject(InstructorService);
  private readonly courseService = inject(CourseService);
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
    this.isLoading.set(true);
    const randId = Math.floor(1000 + Math.random() * 9000);
    this.courseService.createCourse({
      title: `Quiz Assessment #${randId}`,
      categoryId: '00000000-0000-0000-0000-000000000000',
      shortDescription: 'Interactive quiz test for students',
      description: 'Test assessment created via Quiz Creator',
      price: 0,
      isFree: true,
      currency: 'USD',
      level: 4,
      language: 'English'
    }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        const courseId = res.id || res.data?.id;
        if (courseId) {
          this.router.navigate(['/courses', courseId, 'curriculum']);
        } else {
          this.router.navigate(['/courses/new']);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/courses/new']);
      }
    });
  }
}

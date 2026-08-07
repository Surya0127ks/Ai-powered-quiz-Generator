import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserQuizDashboardSummary, UserAttemptItem, UserQuizItem, QuizLeaderboardItem } from '../../../core/models/quiz.model';

@Component({
  selector: 'app-student-progress',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="analytics-container">
      <!-- Page Header -->
      <header class="page-header saas-card">
        <div class="header-main">
          <div class="badge badge-primary mb-2">📊 ASSESSMENT HISTORY</div>
          <h1>Attempt History & Performance</h1>
          <p>Detailed summary of your quiz performance, correct vs. wrong answers count, and earned certificates.</p>
        </div>
        <div class="header-actions">
          @if (activeTab() === 'student' && (summary()?.myAttempts?.length ?? 0) > 0) {
            <button (click)="onClearHistory()" [disabled]="isClearing()" class="btn btn-danger btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>{{ isClearing() ? 'Clearing...' : 'Clear All History' }}</span>
            </button>
          }
          <a routerLink="/quizzes/new" class="btn btn-ai btn-sm">
            ✨ Take New AI Quiz
          </a>
        </div>
      </header>

      <!-- Dual Tabs -->
      @if (showStudentTab() && showInstructorTab()) {
        <div class="view-tabs mb-3">
          <button class="tab-btn" [class.active]="activeTab() === 'student'" (click)="activeTab.set('student')">
            👨‍🎓 My Learning Progress
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'instructor'" (click)="activeTab.set('instructor')">
            👨‍🏫 Instructor: Student Progress
          </button>
        </div>
      } @else {
        <div class="mb-3"></div> <!-- Spacing if only one view is present -->
      }

      <!-- Toast Notification -->
      @if (toastMessage()) {
        <div class="toast-notification">
          {{ toastMessage() }}
        </div>
      }

      <!-- Performance Report Modal Dialog -->
      @if (selectedReportAttempt()) {
        <div class="modal-backdrop" (click)="selectedReportAttempt.set(null)">
          <div class="modal-content saas-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>📊 Assessment Performance Summary</h3>
              <button (click)="selectedReportAttempt.set(null)" class="close-btn">✕</button>
            </div>
            <div class="report-modal-body">
              <div class="report-title-box mb-3">
                <span class="badge" [class.badge-emerald]="selectedReportAttempt()?.isPassed" [class.badge-slate]="!selectedReportAttempt()?.isPassed">
                  {{ selectedReportAttempt()?.isPassed ? '🏆 PASSED ASSESSMENT' : '⚠️ NEEDS IMPROVEMENT' }}
                </span>
                <h2>{{ selectedReportAttempt()?.quizTitle }}</h2>
                <p class="text-muted font-sm">Submitted on {{ selectedReportAttempt()?.submittedAtUtc | date:'medium' }}</p>
              </div>

              <!-- Correct / Wrong Answers Breakdown -->
              <div class="report-stats-grid mb-3">
                <div class="report-stat-box score">
                  <span class="stat-label">Final Score</span>
                  <span class="stat-num text-primary">{{ selectedReportAttempt()?.scorePercentage }}%</span>
                </div>
                <div class="report-stat-box correct">
                  <span class="stat-label">Correct Answers</span>
                  <span class="stat-num text-success">✓ {{ getCorrectCount(selectedReportAttempt()?.scorePercentage) }}</span>
                </div>
                <div class="report-stat-box wrong">
                  <span class="stat-label">Wrong Answers</span>
                  <span class="stat-num text-danger">❌ {{ getWrongCount(selectedReportAttempt()?.scorePercentage) }}</span>
                </div>
              </div>

              <div class="report-actions margin-top">
                @if (selectedReportAttempt()?.isPassed) {
                  <a
                    [routerLink]="['/certificate/generator']"
                    [queryParams]="{ student: (authService.currentUser()?.firstName || 'Student') + ' ' + (authService.currentUser()?.lastName || ''), title: selectedReportAttempt()?.quizTitle, score: selectedReportAttempt()?.scorePercentage }"
                    class="btn btn-ai width-full mb-2"
                  >
                    📜 Generate & Issue Official Certificate
                  </a>
                }
                <button (click)="selectedReportAttempt.set(null)" class="btn btn-outline width-full">Close Report</button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (isLoading()) {
        <div class="card p-4">
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
        </div>
      } @else if (summary()) {
        
        @if (activeTab() === 'student') {
          <!-- Key Performance Metrics Grid -->
          <div class="stats-grid">
            <div class="stat-card saas-card">
              <div class="stat-header">
                <span class="stat-title">Total Attempts</span>
                <svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
              <div class="stat-value">{{ summary()?.totalAttemptsCount ?? 0 }}</div>
              <span class="stat-subtext">Completed quiz assessments</span>
            </div>

            <div class="stat-card saas-card">
              <div class="stat-header">
                <span class="stat-title">Average Score</span>
                <svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 20V10M12 20V4M6 20v-6"></path>
                </svg>
              </div>
              <div class="stat-value">{{ summary()?.avgScorePercentage ?? 0 }}%</div>
              <span class="stat-subtext">Across all quiz attempts</span>
            </div>

            <div class="stat-card saas-card">
              <div class="stat-header">
                <span class="stat-title">Quizzes Passed</span>
                <svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div class="stat-value">{{ summary()?.certificatesEarnedCount ?? 0 }}</div>
              <span class="stat-subtext">Passed threshold target</span>
            </div>

            <div class="stat-card saas-card">
              <div class="stat-header">
                <span class="stat-title">Pass Rate</span>
                <svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="7"></circle>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
              </div>
              <div class="stat-value">{{ getPassRatePercentage() }}%</div>
              <span class="stat-subtext">Passing attempt ratio</span>
            </div>
          </div>

          <!-- Attempt History Table Section -->
          <div class="content-card">
            <div class="section-title-row">
              <div>
                <h3>My Attempt Records</h3>
                <p class="section-subtitle">Chronological record of every quiz I have taken</p>
              </div>
            </div>

            @if ((summary()?.myAttempts?.length ?? 0) === 0) {
              <div class="empty-state-box">
                <div class="empty-icon-wrapper">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                </div>
                <h4>No attempt history found</h4>
                <p>You haven't completed any quizzes yet. Generate a quiz with AI or open a quiz link to start taking assessments.</p>
                <a routerLink="/quizzes/new" class="btn btn-ai">
                  ✨ Generate Quiz with AI
                </a>
              </div>
            } @else {
              <div class="quiz-table-wrapper">
                <table class="qp-table">
                  <thead>
                    <tr>
                      <th>Quiz Title</th>
                      <th>Submitted Date</th>
                      <th>Score</th>
                      <th>Outcome</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (attempt of summary()?.myAttempts; track attempt.id) {
                      <tr>
                        <td>
                          <strong class="text-dark">{{ attempt.quizTitle }}</strong>
                        </td>
                        <td>{{ attempt.submittedAtUtc | date:'mediumDate' }} at {{ attempt.submittedAtUtc | date:'shortTime' }}</td>
                        <td>
                          <span class="score-pill" [class.score-high]="attempt.isPassed" [class.score-medium]="!attempt.isPassed">
                            {{ attempt.scorePercentage }}%
                          </span>
                        </td>
                        <td>
                          @if (attempt.isPassed) {
                            <span class="badge badge-emerald">Passed</span>
                          } @else {
                            <span class="badge badge-slate">Needs Review</span>
                          }
                        </td>
                        <td>
                          <div class="action-btns-row">
                            <button (click)="selectedReportAttempt.set(attempt)" class="btn btn-outline btn-sm">
                              📊 View Report
                            </button>
                            @if (attempt.isPassed) {
                              <a
                                [routerLink]="['/certificate/generator']"
                                [queryParams]="{ student: (authService.currentUser()?.firstName || 'Student') + ' ' + (authService.currentUser()?.lastName || ''), title: attempt.quizTitle, score: attempt.scorePercentage }"
                                class="btn btn-ai btn-sm"
                              >
                                📜 Certificate
                              </a>
                            }
                            <button (click)="onDeleteAttempt(attempt.id)" title="Delete attempt" class="btn btn-ghost btn-sm text-danger">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        } @else {
          <!-- Instructor View -->
          <div class="content-card">
            <div class="mb-2"></div>
            
            <div class="instructor-accordion-list">
              @for (quiz of summary()?.myQuizzes; track quiz.id) {
                <div class="accordion-card" [class.expanded]="expandedQuizId() === quiz.id">
                  <div class="accordion-header" (click)="toggleQuiz(quiz.id)">
                    <div class="accordion-title-col">
                      <span class="accordion-category">{{ quiz.category }}</span>
                      <h4>{{ quiz.title }}</h4>
                    </div>
                    <div class="accordion-stats-col">
                      <span class="accordion-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        {{ quiz.totalAttemptsCount }} Attempts
                      </span>
                      <span class="accordion-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </span>
                    </div>
                  </div>
                  
                  @if (expandedQuizId() === quiz.id) {
                    <div class="accordion-body">
                      @if (isLoadingLeaderboard()[quiz.id]) {
                        <div class="skeleton-wrapper p-3">
                          <div class="skeleton-row"></div>
                          <div class="skeleton-row"></div>
                        </div>
                      } @else if (!leaderboards()[quiz.id] || leaderboards()[quiz.id].length === 0) {
                        <div class="empty-leaderboard">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                          <strong>No student has completed this assessment yet.</strong>
                          <p style="font-size: 0.85rem; margin: 0;">Share your quiz link with students to see results here.</p>
                        </div>
                      } @else {
                        <div class="quiz-table-wrapper">
                          <table class="qp-table">
                            <thead>
                              <tr>
                                <th>Student Name</th>
                                <th>Email</th>
                                <th>Score</th>
                                <th>Outcome</th>
                                <th>Submitted At</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (item of leaderboards()[quiz.id]; track item.attemptId) {
                                <tr>
                                  <td><strong class="text-dark">{{ item.studentName }}</strong></td>
                                  <td>{{ item.studentEmail }}</td>
                                  <td><strong class="score-num-text">{{ item.scorePercentage }}%</strong></td>
                                  <td>
                                    @if (item.isPassed) {
                                      <span class="badge badge-emerald">Passed</span>
                                    } @else {
                                      <span class="badge badge-slate">Needs Review</span>
                                    }
                                  </td>
                                  <td>{{ item.submittedAtUtc | date:'short' }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2.0rem 1.5rem;
    }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 1.0rem; }
    .font-sm { font-size: 0.85rem; }
    .page-header {
      padding: 1.75rem 2.0rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2.0rem;
      background: #ffffff;
      border: 1px solid var(--border-hairline);
      border-radius: 0.75rem;
      h1 { font-size: 1.85rem; font-weight: 800; color: var(--text-primary) !important; margin: 0.25rem 0 0 0; }
      p { color: var(--text-secondary) !important; margin-top: 0.25rem; font-size: 0.925rem; }
    }
    .header-actions { display: flex; gap: 0.75rem; align-items: center; }

    .toast-notification {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 1100;
      background: var(--text-primary);
      color: #ffffff;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 2.25rem;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-hairline);
      border-top: 3px solid var(--color-primary);
      border-radius: 0.75rem;
      padding: 1.25rem 1.35rem;
      display: flex;
      flex-direction: column;
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .stat-title {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-secondary) !important;
    }
    .stat-svg {
      width: 20px;
      height: 20px;
      stroke: var(--color-primary);
    }
    .stat-value {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text-primary) !important;
      line-height: 1.1;
    }
    .stat-subtext {
      font-size: 0.75rem;
      color: var(--text-muted) !important;
      margin-top: 0.35rem;
      font-weight: 400;
    }

    /* Table */
    .quiz-table-wrapper { overflow-x: auto; }
    .qp-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      th { font-size: 0.75rem; font-weight: 700; color: var(--text-muted) !important; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--border-hairline); }
      td { padding: 0.9rem 0.85rem; border-bottom: 1px solid var(--bg-app); font-size: 0.875rem; vertical-align: middle; color: var(--text-secondary); }
    }
    .text-dark { color: var(--text-primary) !important; }
    .action-btns-row { display: flex; gap: 0.4rem; align-items: center; }
    .text-danger { color: var(--color-danger) !important; }

    .score-pill { font-size: 0.8rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 4px; }
    .score-high { background: var(--color-success-bg); color: var(--color-success) !important; border: 1px solid var(--color-success-border); }
    .score-medium { background: var(--color-warning-bg); color: var(--color-warning) !important; border: 1px solid var(--color-warning-border); }

    .loading-state { padding: 3.5rem; text-align: center; color: var(--text-muted) !important; font-weight: 600; }

    /* Modal Backdrop & Report Dialog */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-content {
      width: 100%;
      max-width: 480px;
      background: var(--bg-surface);
      border-radius: var(--radius-xl);
      padding: 1.75rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      h3 { font-size: 1.15rem; font-weight: 800; margin: 0; }
      .close-btn { background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
    }
    .report-modal-body {
      h2 { font-size: 1.35rem; font-weight: 800; margin: 0.5rem 0 0.2rem 0; color: var(--text-primary) !important; }
    }
    .report-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin: 1.25rem 0;
    }
    .report-stat-box {
      background: var(--bg-app);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      padding: 0.85rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      .stat-label { font-size: 0.725rem; font-weight: 700; color: var(--text-muted) !important; text-transform: uppercase; }
      .stat-num { font-size: 1.35rem; font-weight: 800; }
    }
    .text-primary { color: var(--color-primary) !important; }
    .text-success { color: var(--color-success) !important; }
    .width-full { width: 100%; }

    .view-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-hairline);
    }
    .tab-btn {
      background: transparent;
      border: none;
      padding: 0.75rem 1.25rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      position: relative;
      transition: color 0.2s ease;
    }
    .tab-btn:hover { color: var(--text-primary); }
    .tab-btn.active { color: var(--color-primary-600); }
    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background: var(--color-primary-600);
    }

    /* Premium Accordion Styling */
    .instructor-accordion-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .accordion-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-xl);
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-sm);
    }
    .accordion-card:hover { 
      box-shadow: var(--shadow-md); 
      border-color: var(--color-primary-200);
      transform: translateY(-2px);
    }
    .accordion-card.expanded { 
      border-color: var(--color-primary-500); 
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.15); 
      transform: translateY(-2px);
    }
    
    .accordion-header {
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      background: var(--bg-surface);
      transition: background 0.2s ease;
    }
    .accordion-card.expanded .accordion-header {
      background: var(--color-primary-50);
      border-bottom: 1px solid var(--color-primary-100);
    }
    .accordion-card:hover:not(.expanded) .accordion-header {
      background: var(--bg-hover);
    }

    .accordion-title-col { display: flex; flex-direction: column; gap: 0.35rem; }
    .accordion-category { 
      font-size: 0.75rem; 
      font-weight: 800; 
      color: var(--color-primary-600); 
      text-transform: uppercase; 
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .accordion-category::before {
      content: '📝';
      font-size: 0.85rem;
    }
    .accordion-title-col h4 { 
      margin: 0; 
      font-size: 1.25rem; 
      color: var(--text-heading); 
      font-weight: 800;
    }
    .accordion-stats-col { display: flex; align-items: center; gap: 1.25rem; }
    .accordion-badge {
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-body);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .accordion-card.expanded .accordion-badge {
      background: var(--color-primary-600);
      color: #ffffff;
      border-color: var(--color-primary-600);
    }
    .accordion-icon { 
      font-size: 1.5rem; 
      color: var(--text-muted); 
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-hover);
    }
    .accordion-card.expanded .accordion-icon { 
      transform: rotate(180deg); 
      color: var(--color-primary-600);
      background: #ffffff;
    }
    .accordion-body { 
      background: #ffffff; 
      padding: 0.5rem;
    }
    .empty-leaderboard {
      padding: 3rem 1rem;
      text-align: center;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .empty-leaderboard svg {
      width: 48px;
      height: 48px;
      stroke: var(--border-strong);
      stroke-width: 1.5;
      margin-bottom: 0.5rem;
    }
    .accordion-body { border-top: 1px solid var(--border-hairline); background: var(--bg-surface); }

    @media (max-width: 900px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 1.0rem; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr; }
      .header-actions { width: 100%; flex-direction: column; align-items: stretch; gap: 0.75rem; }
      .header-actions .btn { width: 100%; text-align: center; justify-content: center; }
      .view-tabs { overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
      .view-tabs::-webkit-scrollbar { display: none; }
      .tab-btn { flex-shrink: 0; white-space: nowrap; }
      .accordion-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; padding: 1rem; }
      .accordion-stats-col { width: 100%; justify-content: space-between; }
      .quiz-table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .qp-table { min-width: 600px; }
      .report-stats-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StudentProgressComponent implements OnInit {
  private readonly quizService = inject(QuizService);
  readonly authService = inject(AuthService);

  readonly activeTab = signal<'student' | 'instructor'>(this.authService.userRole() === 3 ? 'student' : 'instructor');
  readonly summary = signal<UserQuizDashboardSummary | null>(null);
  readonly isLoading = signal(true);
  readonly isClearing = signal(false);
  readonly toastMessage = signal<string | null>(null);
  readonly selectedReportAttempt = signal<UserAttemptItem | null>(null);

  readonly expandedQuizId = signal<string | null>(null);
  readonly leaderboards = signal<Record<string, QuizLeaderboardItem[]>>({});
  readonly isLoadingLeaderboard = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.fetchDashboardSummary();
  }

  showStudentTab(): boolean {
    return this.authService.userRole() === 3 || (this.summary()?.myAttempts?.length ?? 0) > 0;
  }

  showInstructorTab(): boolean {
    return this.authService.userRole() !== 3 || (this.summary()?.myQuizzes?.length ?? 0) > 0;
  }

  fetchDashboardSummary(): void {
    this.isLoading.set(true);
    this.quizService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        
        // If they are an instructor but have taken quizzes and haven't created any, show student view
        if (!this.showInstructorTab() && this.showStudentTab()) {
          this.activeTab.set('student');
        }
        
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getPassRatePercentage(): number {
    const s = this.summary();
    if (!s || s.totalAttemptsCount === 0) return 0;
    return Math.round((s.certificatesEarnedCount / s.totalAttemptsCount) * 100);
  }

  getCorrectCount(scorePercentage?: number): number {
    if (scorePercentage === undefined) return 0;
    return Math.round((scorePercentage / 100) * 10);
  }

  getWrongCount(scorePercentage?: number): number {
    if (scorePercentage === undefined) return 0;
    return 10 - this.getCorrectCount(scorePercentage);
  }

  onDeleteAttempt(attemptId: string): void {
    if (!confirm('Are you sure you want to delete this attempt record?')) return;

    this.quizService.deleteAttempt(attemptId).subscribe({
      next: () => {
        this.toastMessage.set('🗑️ Attempt record deleted successfully.');
        setTimeout(() => this.toastMessage.set(null), 3000);
        this.fetchDashboardSummary();
      },
      error: () => {
        this.toastMessage.set('Failed to delete attempt record.');
        setTimeout(() => this.toastMessage.set(null), 3000);
      }
    });
  }

  onClearHistory(): void {
    if (!confirm('Are you sure you want to clear ALL attempt history? This action cannot be undone.')) return;

    this.isClearing.set(true);
    this.quizService.clearAttemptHistory().subscribe({
      next: () => {
        this.isClearing.set(false);
        this.toastMessage.set('🧹 All attempt history has been cleared.');
        setTimeout(() => this.toastMessage.set(null), 3000);
        this.fetchDashboardSummary();
      },
      error: () => {
        this.isClearing.set(false);
        this.toastMessage.set('Failed to clear attempt history.');
        setTimeout(() => this.toastMessage.set(null), 3000);
      }
    });
  }

  toggleQuiz(quizId: string): void {
    if (this.expandedQuizId() === quizId) {
      this.expandedQuizId.set(null);
      return;
    }
    
    this.expandedQuizId.set(quizId);
    
    // Only fetch if we haven't loaded it yet
    if (!this.leaderboards()[quizId]) {
      this.isLoadingLeaderboard.update(s => ({ ...s, [quizId]: true }));
      this.quizService.getQuizLeaderboard(quizId).subscribe({
        next: (items) => {
          this.leaderboards.update(s => ({ ...s, [quizId]: items }));
          this.isLoadingLeaderboard.update(s => ({ ...s, [quizId]: false }));
        },
        error: (err) => {
          console.error(err);
          this.isLoadingLeaderboard.update(s => ({ ...s, [quizId]: false }));
        }
      });
    }
  }
}

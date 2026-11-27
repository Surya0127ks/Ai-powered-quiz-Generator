import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { AuthService } from '../../../core/services/auth.service';
import { copyTextToClipboard } from '../../../core/utils/clipboard';
import { formatDurationSeconds } from '../../../core/utils/format-duration';
import {
  AdminAttemptDetails,
  QuizLeaderboardItem,
  UserQuizDashboardSummary,
  UserQuizItem
} from '../../../core/models/quiz.model';

type StatusFilter = 'all' | 'published' | 'draft';

@Component({
  selector: 'app-my-quizzes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="my-quizzes-layout">
      <!-- Page Header -->
      <header class="mq-header saas-card mb-4">
        <div class="mq-header-copy">
          <div class="mq-eyebrow-row">
            <span class="mq-eyebrow">Teacher quiz library</span>
          </div>
          <h1>My Quizzes</h1>
          <p>
            Manage every assessment you have created. Preview and play your own quizzes to check the learner experience, edit questions, copy share links, or inspect submissions.
          </p>
        </div>
        <div class="mq-header-actions">
          <a routerLink="/quizzes/new" class="btn btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            New quiz
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{ mode: 'govt' }" class="btn btn-secondary">
            Exam hub
          </a>
        </div>
      </header>

      @if (toastMessage()) {
        <div class="toast-notification" role="status" aria-live="polite">
          {{ toastMessage() }}
        </div>
      }

      <!-- Metrics Strip -->
      <div class="mq-stats-grid mb-4">
        <div class="mq-stat-card tone-cobalt">
          <span class="mq-stat-label"><span class="stat-dot dot-cobalt"></span> Total created</span>
          <strong class="mq-stat-val mono-num">{{ allQuizzes().length }}</strong>
          <span class="mq-stat-sub">Published and drafts</span>
        </div>
        <div class="mq-stat-card tone-emerald">
          <span class="mq-stat-label"><span class="stat-dot dot-emerald"></span> Published live</span>
          <strong class="mq-stat-val mono-num">{{ publishedCount() }}</strong>
          <span class="mq-stat-sub">Ready to share</span>
        </div>
        <div class="mq-stat-card tone-amber">
          <span class="mq-stat-label"><span class="stat-dot dot-amber"></span> Saved drafts</span>
          <strong class="mq-stat-val mono-num">{{ draftCount() }}</strong>
          <span class="mq-stat-sub">Unpublished sets</span>
        </div>
        <div class="mq-stat-card tone-teal">
          <span class="mq-stat-label"><span class="stat-dot dot-teal"></span> Student attempts</span>
          <strong class="mq-stat-val mono-num">{{ totalAttemptsCount() }}</strong>
          <span class="mq-stat-sub">Across all quizzes</span>
        </div>
      </div>

      <!-- Filter & Search Controls -->
      <section class="mq-toolbar saas-card mb-4">
        <div class="filter-tabs" role="tablist" aria-label="Quiz status filter">
          <button
            type="button"
            class="filter-tab"
            [class.active]="statusFilter() === 'all'"
            (click)="statusFilter.set('all')"
          >
            All <span class="tab-count mono-num">{{ allQuizzes().length }}</span>
          </button>
          <button
            type="button"
            class="filter-tab"
            [class.active]="statusFilter() === 'published'"
            (click)="statusFilter.set('published')"
          >
            Published <span class="tab-count mono-num">{{ publishedCount() }}</span>
          </button>
          <button
            type="button"
            class="filter-tab"
            [class.active]="statusFilter() === 'draft'"
            (click)="statusFilter.set('draft')"
          >
            Drafts <span class="tab-count mono-num">{{ draftCount() }}</span>
          </button>
        </div>

        <div class="search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Search by quiz title or category"
            aria-label="Search quizzes"
            class="search-input"
          />
        </div>
      </section>

      <!-- Quizzes List / Cards -->
      @if (isLoading()) {
        <div class="content-card">
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
        </div>
      } @else if (filteredQuizzes().length === 0) {
        <div class="content-card empty-state-box">
          <div class="empty-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h4>
            @if (allQuizzes().length === 0) {
              No quizzes created yet
            } @else {
              No quizzes match this filter
            }
          </h4>
          <p>
            @if (allQuizzes().length === 0) {
              Create your first assessment with AI or the manual builder, preview how learners experience it, and share one link with up to 50 students.
            } @else {
              Try switching status filter tabs or clearing your search text.
            }
          </p>
          @if (allQuizzes().length === 0) {
            <a routerLink="/quizzes/new" class="btn btn-primary btn-sm">Create first quiz</a>
          } @else {
            <button type="button" (click)="resetFilters()" class="btn btn-outline btn-sm">Reset filters</button>
          }
        </div>
      } @else {
        <div class="mq-cards-grid">
          @for (q of filteredQuizzes(); track q.id) {
            <article class="mq-quiz-card saas-card" [class.is-draft]="!q.isPublished">
              <div class="card-top-row">
                <div class="card-badges">
                  @if (q.isPublished) {
                    <span class="badge badge-emerald"><span class="live-dot"></span> Published</span>
                  } @else {
                    <span class="badge badge-amber">Draft</span>
                  }
                  <span class="category-chip">{{ q.category || 'General' }}</span>
                </div>
                <span class="created-date">{{ q.createdAtUtc | date:'mediumDate' }}</span>
              </div>

              <h2 class="quiz-title">{{ q.title }}</h2>

              <div class="quiz-specs-row">
                <span class="spec-chip mono-num">{{ q.questionCount }} Qs</span>
                <span class="spec-chip mono-num">{{ q.timeLimitMinutes ? q.timeLimitMinutes + ' min' : 'Untimed' }}</span>
                <span class="spec-chip">{{ q.difficulty || 'Mixed' }}</span>
                <span class="spec-chip mono-num">{{ q.totalAttemptsCount }}/{{ q.maxStudents ?? 15 }} seats</span>
              </div>

              <!-- Student Activity Strip -->
              <div class="activity-strip" [class.has-activity]="q.totalAttemptsCount > 0">
                @if (q.totalAttemptsCount === 0) {
                  <span class="activity-muted">
                    {{ q.isPublished ? 'No student attempts yet · ready for learner responses' : 'Draft assessment · publish via Edit to accept student attempts' }}
                  </span>
                } @else {
                  <div class="activity-metrics">
                    <span><strong class="mono-num">{{ q.totalAttemptsCount }}</strong> attempts</span>
                    <span><strong class="mono-num">{{ q.avgScorePercentage }}%</strong> avg score</span>
                    <span><strong class="mono-num">{{ q.passedCount ?? 0 }}/{{ q.totalAttemptsCount }}</strong> passed</span>
                  </div>
                }
              </div>

              <!-- Cap Alert -->
              @if (q.isCapReached && q.isPublished) {
                <div class="cap-alert-row">
                  <span>Seat limit reached (<strong class="mono-num">{{ q.totalAttemptsCount }}/{{ q.maxStudents }}</strong>)</span>
                  @if ((q.maxStudents ?? 15) < 50 && (q.limitExtensionCount || 0) < 2) {
                    <button type="button" (click)="extendQuizLimit(q)" class="btn btn-primary btn-sm">
                      Extend (+15)
                    </button>
                  } @else {
                    <span class="cap-max-note">Max 50 reached</span>
                  }
                </div>
              }

              <!-- Management Actions -->
              <div class="card-actions-grid">
                <a [routerLink]="['/quiz', q.id]" class="btn btn-primary btn-sm" title="Play and test this quiz as learners see it">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Preview / Play
                </a>
                <a [routerLink]="['/quiz', q.id, 'edit']" class="btn btn-secondary btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Edit
                </a>
                @if (q.isPublished && q.shortId) {
                  <button type="button" (click)="copyShareLink(q.shortId!)" class="btn btn-outline btn-sm">
                    Copy link
                  </button>
                }
                <button type="button" (click)="openLeaderboardModal(q)" class="btn btn-outline btn-sm">
                  Submissions ({{ q.totalAttemptsCount }})
                </button>
                <button type="button" (click)="deleteQuiz(q)" class="btn btn-danger btn-sm btn-delete" aria-label="Delete quiz" title="Delete quiz">
                  Delete
                </button>
              </div>
            </article>
          }
        </div>
      }

      <!-- Submissions / Leaderboard Modal -->
      @if (selectedLeaderboardQuiz() && !showScorecardModal()) {
        <div class="modal-backdrop" (click)="selectedLeaderboardQuiz.set(null)">
          <div class="modal-content modal-lg saas-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="modal-eyebrow">Student submissions</span>
                <h3>{{ selectedLeaderboardQuiz()?.title }}</h3>
              </div>
              <button type="button" (click)="selectedLeaderboardQuiz.set(null)" class="close-btn" aria-label="Close">✕</button>
            </div>

            <div class="leaderboard-meta-banner mb-3">
              <div class="meta-item">
                <span class="meta-label">Submissions</span>
                <strong class="meta-val mono-num">{{ leaderboardItems().length }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-label">Passed</span>
                <strong class="meta-val text-success mono-num">{{ getLeaderboardPassedCount() }} ({{ getLeaderboardPassRate() }}%)</strong>
              </div>
              <div class="meta-item">
                <span class="meta-label">Avg score</span>
                <strong class="meta-val text-primary mono-num">{{ selectedLeaderboardQuiz()?.avgScorePercentage }}%</strong>
              </div>
              <div class="meta-item">
                <span class="meta-label">Avg time</span>
                <strong class="meta-val mono-num">{{ formatDuration(getLeaderboardAvgTimeSeconds()) }}</strong>
              </div>
            </div>

            <div class="modal-scroll-body">
              @if (isLeaderboardLoading()) {
                <div class="skeleton-row"></div>
                <div class="skeleton-row"></div>
              } @else if (leaderboardItems().length === 0) {
                <div class="empty-state-box compact-empty">
                  <h4>No student submissions yet</h4>
                  <p>Share the quiz link or preview the test yourself while waiting for student submissions.</p>
                  <div class="empty-actions">
                    <a [routerLink]="['/quiz', selectedLeaderboardQuiz()?.id]" (click)="selectedLeaderboardQuiz.set(null)" class="btn btn-primary btn-sm">
                      Preview quiz
                    </a>
                    @if (selectedLeaderboardQuiz()?.isPublished && selectedLeaderboardQuiz()?.shortId) {
                      <button type="button" (click)="copyShareLink(selectedLeaderboardQuiz()!.shortId!)" class="btn btn-outline btn-sm">
                        Copy link
                      </button>
                    }
                  </div>
                </div>
              } @else {
                <div class="quiz-table-wrapper">
                  <table class="qp-table responsive-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student</th>
                        <th>Score</th>
                        <th>Time</th>
                        <th>Outcome</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of leaderboardItems(); track item.attemptId) {
                        <tr [class.cheat-row]="item.isDisqualified">
                          <td data-label="Rank"><span class="rank-pill mono-num">#{{ item.rank }}</span></td>
                          <td data-label="Student">
                            <div class="student-cell">
                              <strong>{{ item.studentName }}</strong>
                              <small>{{ item.studentEmail }}</small>
                            </div>
                          </td>
                          <td data-label="Score">
                            <strong class="mono-num">{{ item.scorePercentage }}%</strong>
                            <small class="d-block mono-num">{{ item.totalPointsEarned }}/{{ item.totalPossiblePoints }} pts</small>
                          </td>
                          <td data-label="Time" class="mono-num">{{ formatDuration(item.timeTakenSeconds) }}</td>
                          <td data-label="Outcome">
                            @if (item.isDisqualified) {
                              <span class="badge badge-danger">Flagged</span>
                            } @else if (item.isPassed) {
                              <span class="badge badge-emerald">Passed</span>
                            } @else {
                              <span class="badge badge-slate">Needs review</span>
                            }
                          </td>
                          <td data-label="Action">
                            <button type="button" (click)="viewAttemptScorecard(item)" class="btn btn-outline btn-sm">
                              Scorecard
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>

            <div class="modal-footer-row margin-top">
              <button type="button" (click)="selectedLeaderboardQuiz.set(null)" class="btn btn-secondary btn-sm">Close</button>
            </div>
          </div>
        </div>
      }

      <!-- Scorecard Modal -->
      @if (showScorecardModal()) {
        <div class="modal-backdrop" (click)="closeScorecardModal()">
          <div class="modal-content modal-lg saas-card" (click)="$event.stopPropagation()">
            @if (isScorecardLoading()) {
              <div class="modal-header">
                <h3>Loading scorecard...</h3>
                <button type="button" (click)="closeScorecardModal()" class="close-btn" aria-label="Close">✕</button>
              </div>
            } @else if (selectedAttemptDetails()) {
              <div class="modal-header">
                <div>
                  <span class="modal-eyebrow">Attempt scorecard</span>
                  <h3>{{ selectedAttemptDetails()?.quizTitle }}</h3>
                </div>
                <div class="scorecard-header-actions">
                  <button type="button" (click)="printScorecard()" class="btn btn-outline btn-sm">Print</button>
                  <button type="button" (click)="closeScorecardModal()" class="close-btn" aria-label="Close">✕</button>
                </div>
              </div>

              <div class="modal-scroll-body">
                <div class="scorecard-summary mb-3">
                  <div>
                    <span class="sc-meta-label">Student</span>
                    <strong>{{ selectedAttemptDetails()?.studentName }}</strong>
                    <small class="d-block text-muted">{{ selectedAttemptDetails()?.studentEmail }}</small>
                  </div>
                  <div>
                    <span class="sc-meta-label">Score</span>
                    <strong class="mono-num" [class.text-success]="selectedAttemptDetails()?.isPassed" [class.text-danger]="!selectedAttemptDetails()?.isPassed">
                      {{ selectedAttemptDetails()?.scorePercentage }}% ({{ selectedAttemptDetails()?.totalPointsEarned }}/{{ selectedAttemptDetails()?.totalPossiblePoints }} pts)
                    </strong>
                    <small class="d-block text-muted">Time: {{ formatDuration(selectedAttemptDetails()?.timeTakenSeconds) }}</small>
                  </div>
                </div>

                @for (q of selectedAttemptDetails()?.questions; track q.questionId; let i = $index) {
                  <div class="sc-question-item" [class.correct]="q.isCorrect" [class.incorrect]="!q.isCorrect">
                    <div class="sc-q-header">
                      <span class="sc-q-num mono-num">Q{{ i + 1 }}</span>
                      <span class="sc-q-text">{{ q.questionText }}</span>
                      <span class="sc-q-pts mono-num">{{ q.pointsEarned }}/{{ q.points }} pts</span>
                    </div>
                    <div class="sc-options-list">
                      @for (opt of q.options; track opt.optionId) {
                        <div class="sc-option" [class.is-correct]="opt.isCorrect" [class.is-selected]="q.selectedOptionIds.includes(opt.optionId)">
                          <span>{{ opt.optionText }}</span>
                          <div class="sc-badges">
                            @if (q.selectedOptionIds.includes(opt.optionId)) {
                              <span class="sc-chip selected-chip">Selected</span>
                            }
                            @if (opt.isCorrect) {
                              <span class="sc-chip correct-chip">Correct</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                    @if (q.explanation) {
                      <p class="sc-explanation"><strong>Explanation:</strong> {{ q.explanation }}</p>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .my-quizzes-layout {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4.5rem;
      min-width: 0;
    }
    .mb-3 { margin-bottom: 1rem; }
    .mb-4 { margin-bottom: 1.5rem; }
    .margin-top { margin-top: 1.25rem; }
    .d-block { display: block; }
    .mono-num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }

    .mq-header {
      padding: 1.5rem 1.75rem;
      background: var(--surface-tint-blue);
      border: 1px solid var(--color-primary-200);
      border-left: 3px solid var(--color-primary-600);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .mq-header-copy {
      flex: 1;
      min-width: 0;
      h1 { font-size: clamp(1.45rem, 2.5vw, 1.875rem); font-weight: 500; margin: 0 0 0.35rem 0; }
      p { font-size: 0.925rem; color: var(--text-secondary); line-height: 1.55; margin: 0; max-width: 44rem; }
    }
    .mq-eyebrow-row { margin-bottom: 0.45rem; }
    .mq-eyebrow {
      display: inline-flex;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      color: var(--color-primary-700);
    }
    .mq-header-actions {
      display: flex;
      gap: 0.625rem;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    .toast-notification {
      position: fixed;
      top: 76px;
      right: 20px;
      z-index: 1200;
      background: var(--text-heading);
      color: var(--bg-surface);
      padding: 0.65rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: var(--shadow-md);
    }

    /* Stats Strip */
    .mq-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
    }
    .mq-stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      padding: 1.1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      min-width: 0;
    }
    .mq-stat-card.tone-cobalt  { border-top: 2px solid var(--color-primary-600); }
    .mq-stat-card.tone-emerald { border-top: 2px solid var(--color-success-text); }
    .mq-stat-card.tone-amber   { border-top: 2px solid var(--color-warning-text); }
    .mq-stat-card.tone-teal    { border-top: 2px solid var(--color-teal-text); }
    .mq-stat-label {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .stat-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .dot-cobalt  { background: var(--color-primary-600); }
    .dot-emerald { background: var(--color-success-text); }
    .dot-amber   { background: var(--color-warning-text); }
    .dot-teal    { background: var(--color-teal-text); }
    .mq-stat-val { font-size: 1.7rem; font-weight: 500; color: var(--text-heading); line-height: 1.15; }
    .tone-cobalt .mq-stat-val  { color: var(--color-primary-700); }
    .tone-emerald .mq-stat-val { color: var(--color-success-text); }
    .tone-amber .mq-stat-val   { color: var(--color-warning-text); }
    .tone-teal .mq-stat-val    { color: var(--color-teal-text); }
    .mq-stat-sub { font-size: 0.75rem; color: var(--text-muted); }

    /* Toolbar */
    .mq-toolbar {
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.85rem;
    }
    .filter-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .filter-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-hairline);
      background: var(--bg-app);
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 150ms var(--ease-out), border-color 150ms var(--ease-out), color 150ms var(--ease-out);
      &.active {
        background: var(--color-primary-600);
        border-color: var(--color-primary-600);
        color: #ffffff;
        .tab-count { background: rgba(255, 255, 255, 0.22); color: #ffffff; }
      }
    }
    .tab-count {
      font-size: 0.75rem;
      padding: 0.05rem 0.4rem;
      border-radius: 5px;
      background: var(--bg-surface);
      color: var(--text-muted);
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 220px;
      max-width: 340px;
      svg { position: absolute; left: 0.75rem; color: var(--text-muted); pointer-events: none; }
    }
    .search-input {
      padding: 0.5rem 0.85rem 0.5rem 2.2rem !important;
      font-size: 0.875rem !important;
      min-height: 38px;
    }

    /* Cards Grid */
    .mq-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
      gap: 1.1rem;
    }
    .mq-quiz-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-width: 0;
      border-top: 2px solid var(--color-primary-600);
      &.is-draft { border-top-color: var(--color-warning-text); }
    }
    .card-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .card-badges {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-success-text);
      display: inline-block;
    }
    .category-chip {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      background: var(--bg-subtle);
      color: var(--text-secondary);
      border: 1px solid var(--border-hairline);
    }
    .created-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .quiz-title {
      font-size: 1.05rem;
      font-weight: 500;
      color: var(--text-heading) !important;
      line-height: 1.35;
      margin: 0;
      overflow-wrap: anywhere;
    }
    .quiz-specs-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .spec-chip {
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      background: var(--bg-app);
      border: 1px solid var(--border-hairline);
      color: var(--text-secondary);
    }
    .activity-strip {
      padding: 0.65rem 0.8rem;
      border-radius: var(--radius-md);
      background: var(--bg-subtle);
      border: 1px solid var(--border-hairline);
      font-size: 0.8125rem;
      color: var(--text-muted);
      &.has-activity {
        background: var(--surface-tint-emerald);
        border-color: var(--color-success-border);
        color: var(--color-success-text);
      }
    }
    .activity-metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
    }
    .cap-alert-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.55rem 0.75rem;
      border-radius: var(--radius-md);
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning-border);
      font-size: 0.8rem;
      color: var(--color-warning-text);
    }
    .cap-max-note { font-weight: 500; color: var(--color-danger-text); }

    .card-actions-grid {
      margin-top: auto;
      padding-top: 0.35rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      .btn { flex: 1 1 auto; }
      .btn-delete { flex: 0 0 auto; }
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-content {
      width: 100%;
      max-width: 840px;
      max-height: 90dvh;
      display: flex;
      flex-direction: column;
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-xl);
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;
      h3 { font-size: 1.15rem; font-weight: 500; margin: 0.2rem 0 0; }
      .close-btn { background: transparent; border: none; font-size: 1.15rem; cursor: pointer; color: var(--text-muted); padding: 0.25rem; flex-shrink: 0; }
    }
    .modal-eyebrow { font-size: 0.75rem; font-weight: 500; color: var(--color-primary-600); }
    .scorecard-header-actions { display: flex; align-items: center; gap: 0.5rem; }
    .modal-scroll-body { overflow-y: auto; flex: 1; padding-right: 0.25rem; }
    .modal-footer-row { display: flex; justify-content: flex-end; }

    .leaderboard-meta-banner {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.65rem;
      padding: 0.85rem;
      background: var(--bg-app);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      .meta-item { display: flex; flex-direction: column; align-items: center; text-align: center; }
      .meta-label { font-size: 0.75rem; color: var(--text-muted); }
      .meta-val { font-size: 1rem; font-weight: 500; margin-top: 0.15rem; }
    }
    .rank-pill {
      padding: 2px 7px;
      border-radius: 5px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-hairline);
      font-size: 0.75rem;
    }
    .student-cell { display: flex; flex-direction: column; small { color: var(--text-muted); font-size: 0.75rem; } }
    .compact-empty { padding: 1.5rem 1rem; }
    .empty-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }

    .scorecard-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-app);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-hairline);
    }
    .sc-meta-label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.2rem; }
    .sc-question-item {
      padding: 1rem;
      border-radius: var(--radius-md);
      background: var(--bg-app);
      border: 1px solid var(--border-hairline);
      margin-bottom: 0.75rem;
      &.correct { border-left: 3px solid var(--color-success-text); }
      &.incorrect { border-left: 3px solid var(--color-danger-text); }
    }
    .sc-q-header { display: flex; align-items: flex-start; gap: 0.6rem; margin-bottom: 0.65rem; flex-wrap: wrap; }
    .sc-q-num { font-size: 0.75rem; padding: 0.15rem 0.45rem; border-radius: 5px; background: var(--color-primary-50); color: var(--color-primary-700); }
    .sc-q-text { flex: 1; min-width: 180px; font-weight: 500; color: var(--text-heading); }
    .sc-q-pts { font-size: 0.8rem; color: var(--text-muted); }
    .sc-options-list { display: flex; flex-direction: column; gap: 0.4rem; }
    .sc-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.55rem 0.75rem;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      font-size: 0.875rem;
      &.is-correct { background: var(--color-success-bg); border-color: var(--color-success-border); }
      &.is-selected { border-color: var(--color-primary-600); }
    }
    .sc-badges { display: flex; gap: 0.35rem; }
    .sc-chip { font-size: 0.7rem; padding: 0.1rem 0.45rem; border-radius: 4px; color: #ffffff; }
    .selected-chip { background: var(--color-primary-600); }
    .correct-chip { background: var(--color-success-text); }
    .sc-explanation { margin: 0.65rem 0 0; font-size: 0.84rem; color: var(--text-body); }
    .text-success { color: var(--color-success-text) !important; }
    .text-danger { color: var(--color-danger-text) !important; }
    .text-primary { color: var(--color-primary-600) !important; }

    @media (max-width: 900px) {
      .mq-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .mq-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .mq-header-actions { width: 100%; }
      .mq-header-actions .btn { flex: 1; }
    }

    @media (max-width: 640px) {
      .my-quizzes-layout { padding: 1rem 0.75rem 3rem; }
      .mq-header { padding: 1.15rem; }
      .mq-header-actions { flex-direction: column; }
      .mq-header-actions .btn { width: 100%; }
      .mq-stats-grid { gap: 0.65rem; }
      .mq-stat-card { padding: 0.9rem; }
      .mq-stat-val { font-size: 1.4rem; }
      .mq-toolbar { padding: 0.9rem; }
      .filter-tabs { width: 100%; }
      .filter-tab { flex: 1; justify-content: center; padding: 0.45rem 0.5rem; font-size: 0.8rem; }
      .search-box { max-width: none; width: 100%; min-width: 0; }
      .leaderboard-meta-banner { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .scorecard-summary { grid-template-columns: 1fr; }
      .modal-content { padding: 1rem; }

      .responsive-table thead { display: none; }
      .responsive-table, .responsive-table tbody, .responsive-table tr, .responsive-table td {
        display: block;
        width: 100%;
      }
      .responsive-table tr {
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        padding: 0.75rem;
        margin-bottom: 0.65rem;
        background: var(--bg-surface);
      }
      .responsive-table td {
        border-bottom: none;
        padding: 0.25rem 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        text-align: right;
      }
      .responsive-table td::before {
        content: attr(data-label);
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-muted);
        text-align: left;
      }
      .student-cell { align-items: flex-end; }
    }
  `]
})
export class MyQuizzesComponent implements OnInit {
  private readonly quizService = inject(QuizService);
  readonly authService = inject(AuthService);

  readonly summary = signal<UserQuizDashboardSummary | null>(null);
  readonly isLoading = signal(true);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly searchTerm = signal('');
  readonly toastMessage = signal<string | null>(null);

  readonly selectedLeaderboardQuiz = signal<UserQuizItem | null>(null);
  readonly leaderboardItems = signal<QuizLeaderboardItem[]>([]);
  readonly isLeaderboardLoading = signal(false);

  readonly showScorecardModal = signal(false);
  readonly isScorecardLoading = signal(false);
  readonly selectedAttemptDetails = signal<AdminAttemptDetails | null>(null);

  readonly formatDuration = formatDurationSeconds;

  readonly allQuizzes = computed(() => this.summary()?.myQuizzes ?? []);
  readonly publishedCount = computed(() => this.allQuizzes().filter(q => q.isPublished).length);
  readonly draftCount = computed(() => this.allQuizzes().filter(q => !q.isPublished).length);
  readonly totalAttemptsCount = computed(() =>
    this.allQuizzes().reduce((acc, q) => acc + (q.totalAttemptsCount || 0), 0)
  );

  readonly filteredQuizzes = computed(() => {
    const filter = this.statusFilter();
    const query = this.searchTerm().trim().toLowerCase();

    return this.allQuizzes().filter(q => {
      if (filter === 'published' && !q.isPublished) return false;
      if (filter === 'draft' && q.isPublished) return false;
      if (query) {
        const hay = `${q.title} ${q.category || ''} ${q.difficulty || ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.fetchQuizzes();
  }

  fetchQuizzes(): void {
    this.isLoading.set(true);
    this.quizService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  resetFilters(): void {
    this.statusFilter.set('all');
    this.searchTerm.set('');
  }

  async copyShareLink(shortId: string): Promise<void> {
    const url = `${window.location.origin}/q/${shortId}`;
    const copied = await copyTextToClipboard(url);
    this.showToast(copied ? 'Share link copied to clipboard' : 'Could not copy link');
  }

  extendQuizLimit(quiz: UserQuizItem): void {
    if ((quiz.limitExtensionCount ?? 0) >= 2) return;
    this.quizService.extendQuizLimit(quiz.id).subscribe({
      next: (res) => {
        this.showToast(res.message);
        this.fetchQuizzes();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to extend seat limit');
      }
    });
  }

  deleteQuiz(quiz: UserQuizItem): void {
    if (!confirm(`Delete "${quiz.title}"? This action cannot be undone.`)) return;
    this.quizService.deleteQuiz(quiz.id).subscribe({
      next: () => {
        this.showToast('Quiz deleted');
        this.fetchQuizzes();
      },
      error: () => {
        this.showToast('Failed to delete quiz');
      }
    });
  }

  openLeaderboardModal(quiz: UserQuizItem): void {
    this.selectedLeaderboardQuiz.set(quiz);
    this.isLeaderboardLoading.set(true);
    this.quizService.getQuizLeaderboard(quiz.id).subscribe({
      next: (items) => {
        this.leaderboardItems.set(items);
        this.isLeaderboardLoading.set(false);
      },
      error: () => {
        this.isLeaderboardLoading.set(false);
      }
    });
  }

  getLeaderboardPassedCount(): number {
    return this.leaderboardItems().filter(item => item.isPassed && !item.isDisqualified).length;
  }

  getLeaderboardPassRate(): number {
    const total = this.leaderboardItems().length;
    if (total === 0) return 0;
    return Math.round((this.getLeaderboardPassedCount() / total) * 100);
  }

  getLeaderboardAvgTimeSeconds(): number | null {
    const timed = this.leaderboardItems().filter(
      item => item.timeTakenSeconds !== null && item.timeTakenSeconds !== undefined
    );
    if (timed.length === 0) return null;
    const sum = timed.reduce((acc, item) => acc + (item.timeTakenSeconds ?? 0), 0);
    return Math.round(sum / timed.length);
  }

  viewAttemptScorecard(attempt: QuizLeaderboardItem): void {
    this.isScorecardLoading.set(true);
    this.showScorecardModal.set(true);
    this.quizService.getAttemptDetails(attempt.attemptId).subscribe({
      next: (details: AdminAttemptDetails) => {
        this.selectedAttemptDetails.set(details);
        this.isScorecardLoading.set(false);
      },
      error: () => {
        this.isScorecardLoading.set(false);
      }
    });
  }

  closeScorecardModal(): void {
    this.showScorecardModal.set(false);
    this.selectedAttemptDetails.set(null);
  }

  printScorecard(): void {
    window.print();
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { QuizService } from '../../core/services/quiz.service';
import { UserQuizDashboardSummary, UserAttemptItem, UserQuizItem, QuizLeaderboardItem, AdminAttemptDetails } from '../../core/models/quiz.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-layout">
      <!-- Adaptive Hero Welcome Banner -->
      <header class="dashboard-hero saas-card mb-4 print-hide">
        <div class="hero-content">
          <div class="hero-badge-row mb-2">
            <span class="hero-badge">⚡ QUIZPULSE ASSESSMENT PLATFORM</span>
          </div>
          <h1>Welcome back, {{ authService.currentUser()?.firstName || 'User' }}</h1>
          <p class="hero-desc">
            Generate AI assessments in seconds with Groq LLM, track student performance, view live admin leaderboards, and issue verified digital certificates.
          </p>
        </div>
        <div class="hero-actions">
          <a routerLink="/quizzes/new" class="hero-btn">
            ✨ Create Quiz with AI
          </a>
        </div>
      </header>

      <!-- Toast Notification -->
      @if (showToast()) {
        <div class="toast-notification print-hide">
          ✨ Shareable Quiz Link copied to clipboard!
        </div>
      }

      <!-- Detailed Scorecard / Admin Review Modal -->
      @if (showScorecardModal()) {
        <div class="modal-backdrop scorecard-backdrop" style="z-index: 1050;" (click)="closeScorecardModal()">
          <div class="modal-content modal-lg scorecard-modal-content saas-card" style="z-index: 1051;" (click)="$event.stopPropagation()">
            @if (isScorecardLoading()) {
              <div class="modal-header">
                <h3>Loading Scorecard...</h3>
                <button (click)="closeScorecardModal()" class="close-btn">✕</button>
              </div>
              <div class="modal-body" style="text-align: center; padding: 2rem;">
                <div class="spinner"></div> Loading student attempt details...
              </div>
            } @else if (selectedAttemptDetails()) {
              <div class="modal-header print-hide">
                <h3>📋 Assessment Scorecard Review</h3>
                <div style="display: flex; gap: 1rem;">
                  <button (click)="printScorecard()" class="btn btn-outline btn-sm">🖨️ Print Scorecard</button>
                  <button (click)="closeScorecardModal()" class="close-btn">✕</button>
                </div>
              </div>
              <div class="modal-body scorecard-body">
                <!-- Scorecard Header -->
                <div class="scorecard-header">
                  <div class="scorecard-brand">
                    <h2 class="print-show-inline">QuizPulse Official Scorecard</h2>
                    <h3>{{ selectedAttemptDetails()?.quizTitle }}</h3>
                  </div>
                  
                  <div class="scorecard-summary-grid">
                    <div class="sc-info-box">
                      <strong>Student Details</strong>
                      <div>Name: {{ selectedAttemptDetails()?.studentName }}</div>
                      <div>Email: {{ selectedAttemptDetails()?.studentEmail }}</div>
                      @if (selectedAttemptDetails()?.rollNumber) { <div>Roll No: {{ selectedAttemptDetails()?.rollNumber }}</div> }
                    </div>
                    <div class="sc-info-box">
                      <strong>Result Overview</strong>
                      <div>Submitted: {{ selectedAttemptDetails()?.submittedAtUtc | date:'medium' }}</div>
                      <div>Status: <span [style.color]="selectedAttemptDetails()?.isPassed ? 'green' : 'red'">{{ selectedAttemptDetails()?.isPassed ? 'PASSED' : 'NEEDS REVIEW' }}</span></div>
                      <div>Focus Lost Flags: <strong style="color: red;">{{ selectedAttemptDetails()?.focusLostCount }}</strong></div>
                    </div>
                    <div class="sc-score-box">
                      <div class="sc-score-label">Final Score</div>
                      <div class="sc-score-val" [class.passed]="selectedAttemptDetails()?.isPassed">{{ selectedAttemptDetails()?.scorePercentage }}%</div>
                      <div class="sc-score-sub">{{ selectedAttemptDetails()?.totalPointsEarned }} / {{ selectedAttemptDetails()?.totalPossiblePoints }} pts</div>
                    </div>
                  </div>
                </div>

                <!-- Questions List -->
                <div class="scorecard-questions">
                  <h4>Detailed Question Review</h4>
                  @for (q of selectedAttemptDetails()?.questions; track q.questionId; let i = $index) {
                    <div class="sc-question-item" [class.correct]="q.isCorrect" [class.incorrect]="!q.isCorrect">
                      <div class="sc-q-header">
                        <span class="sc-q-num">Q{{ i + 1 }}</span>
                        <span class="sc-q-text">{{ q.questionText }}</span>
                        <span class="sc-q-points">{{ q.pointsEarned }} / {{ q.points }} pts</span>
                      </div>
                      
                      <div class="sc-options-list">
                        @for (opt of q.options; track opt.optionId) {
                          <div class="sc-option" 
                               [class.is-correct]="opt.isCorrect" 
                               [class.is-selected]="q.selectedOptionIds.includes(opt.optionId)">
                            <div class="sc-opt-indicator">
                              @if (opt.isCorrect) {
                                ✓
                              } @else if (q.selectedOptionIds.includes(opt.optionId) && !opt.isCorrect) {
                                ❌
                              } @else {
                                ◯
                              }
                            </div>
                            <div class="sc-opt-text">{{ opt.optionText }}</div>
                            @if (q.selectedOptionIds.includes(opt.optionId)) {
                              <span class="sc-opt-badge student-choice">Student Answer</span>
                            }
                            @if (opt.isCorrect) {
                              <span class="sc-opt-badge correct-choice">Correct Answer</span>
                            }
                          </div>
                        }
                      </div>
                      @if (q.explanation && q.explanation.trim() !== '') {
                        <div class="sc-q-explanation">
                          <strong>Explanation:</strong> {{ q.explanation }}
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
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
                  <span class="stat-num text-success">✓ {{ getCorrectCount(selectedReportAttempt()?.scorePercentage ?? 0) }}</span>
                </div>
                <div class="report-stat-box wrong">
                  <span class="stat-label">Wrong Answers</span>
                  <span class="stat-num text-danger">❌ {{ getWrongCount(selectedReportAttempt()?.scorePercentage ?? 0) }}</span>
                </div>
              </div>

              <div class="report-actions margin-top">
                @if (selectedReportAttempt()?.isPassed) {
                  <a
                    [routerLink]="['/certificate/generator']"
                    [queryParams]="{ student: (authService.currentUser()?.firstName || 'Student') + ' ' + (authService.currentUser()?.lastName || ''), title: selectedReportAttempt()?.quizTitle, score: selectedReportAttempt()?.scorePercentage }"
                    class="btn btn-ai width-full mb-2 print-hide"
                  >
                    📜 Generate & Issue Official Certificate
                  </a>
                }
                <button onclick="window.print()" class="btn btn-outline width-full mb-2 print-hide">
                  📥 Save Result PDF
                </button>
                <button (click)="selectedReportAttempt.set(null)" class="btn btn-secondary width-full print-hide">Close Report</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ADMIN LEADERBOARD & STUDENT SUBMISSIONS MODAL -->
      @if (selectedLeaderboardQuiz() && !showScorecardModal()) {
        <div class="modal-backdrop" (click)="selectedLeaderboardQuiz.set(null)">
          <div class="modal-content modal-lg saas-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-title">
                <span class="badge badge-ai mb-1">🏆 ADMIN ASSESSMENT LEADERBOARD</span>
                <h3>{{ selectedLeaderboardQuiz()?.title }}</h3>
              </div>
              <button (click)="selectedLeaderboardQuiz.set(null)" class="close-btn">✕</button>
            </div>
            <div class="leaderboard-modal-body">
              <div class="leaderboard-meta-banner mb-3">
                <div class="meta-item">
                  <span class="meta-label">Total Submissions</span>
                  <strong class="meta-val">{{ leaderboardItems().length }} Students</strong>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Category</span>
                  <strong class="meta-val">{{ selectedLeaderboardQuiz()?.category }}</strong>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Overall Avg Score</span>
                  <strong class="meta-val text-primary">{{ selectedLeaderboardQuiz()?.avgScorePercentage }}%</strong>
                </div>
              </div>

              @if (isLeaderboardLoading()) {
                <div class="skeleton-wrapper">
                  <div class="skeleton-row"></div>
                  <div class="skeleton-row"></div>
                  <div class="skeleton-row"></div>
                </div>
              } @else if (leaderboardItems().length === 0) {
                <div class="empty-state-box">
                  <div class="empty-icon-wrapper">🏆</div>
                  <h4>No student submissions yet</h4>
                  <p>Share this quiz link with your students. Once students type their name and complete the quiz, their scores and rank will appear here live.</p>
                  <button (click)="copyShareLink(selectedLeaderboardQuiz()!.shortId!)" class="btn btn-primary btn-sm">
                    📋 Copy Share Link for Students
                  </button>
                </div>
              } @else {
                <div class="quiz-table-wrapper">
                  <table class="qp-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Full Name</th>
                        <th>Contact / Email</th>
                        <th>Score</th>
                        <th>Outcome</th>
                        <th>Submitted At</th>
                        <th>Admin Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of leaderboardItems(); track item.attemptId) {
                        <tr [class.cheat-row]="item.isDisqualified">
                          <td>
                            <span class="rank-badge" [class.rank-1]="item.rank === 1" [class.rank-2]="item.rank === 2" [class.rank-3]="item.rank === 3">
                              {{ item.rank === 1 ? '🥇 1st' : item.rank === 2 ? '🥈 2nd' : item.rank === 3 ? '🥉 3rd' : '#' + item.rank }}
                            </span>
                          </td>
                          <td>
                            <strong class="text-dark font-weight-bold">{{ item.studentName }}</strong>
                            @if (item.isDisqualified) {
                              <span class="cheat-badge">🚫 DISQUALIFIED</span>
                            }
                          </td>
                          <td class="text-muted">{{ item.studentEmail }}</td>
                          <td>
                            <strong class="score-num-text">{{ item.scorePercentage }}%</strong>
                            <small class="text-muted d-block">({{ item.totalPointsEarned }}/{{ item.totalPossiblePoints }} pts)</small>
                          </td>
                          <td>
                            @if (item.isDisqualified) {
                              <span class="badge" style="background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid var(--color-danger-border);">🚫 Cheating</span>
                            } @else if (item.isPassed) {
                              <span class="badge badge-emerald">🏆 Passed</span>
                            } @else {
                              <span class="badge badge-slate">Needs Review</span>
                            }
                            @if ((item.focusLostCount ?? 0) > 0 && !item.isDisqualified) {
                              <small class="text-muted d-block" style="color: var(--color-warning) !important;">⚠️ {{ item.focusLostCount }} tab switch(es)</small>
                            }
                          </td>
                          <td>{{ item.submittedAtUtc | date:'short' }}</td>
                          <td>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                              <button (click)="viewAttemptScorecard(item)" class="btn btn-outline btn-sm" title="View Detailed Scorecard">
                                📊 Scorecard
                              </button>
                              @if (item.isPassed && !item.isDisqualified) {
                                <a
                                  [routerLink]="['/certificate/generator']"
                                  [queryParams]="{ student: item.studentName, title: selectedLeaderboardQuiz()?.title, score: item.scorePercentage }"
                                  class="btn btn-ai btn-sm"
                                  title="Generate Certificate"
                                >
                                  📜 Cert
                                </a>
                              }
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <div class="modal-footer-row margin-top">
                <button (click)="selectedLeaderboardQuiz.set(null)" class="btn btn-secondary">Close Leaderboard</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Instant AI Prompt Suggestion Tool Bar -->
      <div class="suggestion-toolbar saas-card mb-4 print-hide">
        <div class="suggestion-header mb-2">
          <div class="suggestion-title-group">
            <div class="ai-spark-circle">✨</div>
            <div>
              <span class="suggestion-title">Groq AI Instant Quick Launcher</span>
              <p class="suggestion-desc">Tap any domain topic below to auto-fill details & generate a 10-item quiz instantly</p>
            </div>
          </div>
        </div>
        <div class="topic-pills-row">
          <a routerLink="/quizzes/new" [queryParams]="{topic: 'Artificial Intelligence & Groq LLM', auto: 'true'}" class="topic-pill pill-ai">
            🤖 Artificial Intelligence & LLMs
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{topic: 'Full-Stack Web Development', auto: 'true'}" class="topic-pill pill-indigo">
            💻 Web Development
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{topic: 'Python & Data Science', auto: 'true'}" class="topic-pill pill-emerald">
            🐍 Python & Data Science
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{topic: 'Cyber Security & Cloud', auto: 'true'}" class="topic-pill pill-slate">
            🛡️ Cyber Security
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{topic: 'General Science & Tech', auto: 'true'}" class="topic-pill pill-indigo">
            💡 General Science
          </a>
        </div>
      </div>

      <!-- Key Performance Metrics Cards -->
      <div class="metrics-grid mb-4 print-hide">
        <div class="stat-card card-indigo saas-card">
          <div class="stat-card-top">
            <div class="stat-icon-box icon-indigo">
              <svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
              </svg>
            </div>
            <span class="stat-title">Quizzes Created</span>
          </div>
          <div class="stat-value">{{ summary()?.quizzesCreatedCount ?? 0 }}</div>
          <span class="stat-subtext">{{ summary()?.publishedCount ?? 0 }} Published · {{ summary()?.draftsCount ?? 0 }} Drafts</span>
        </div>

        <div class="stat-card card-purple saas-card">
          <div class="stat-card-top">
            <div class="stat-icon-box icon-purple">
              <svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            <span class="stat-title">Total Attempts</span>
          </div>
          <div class="stat-value">{{ getTotalAttempts() }}</div>
          <span class="stat-subtext">Across your assessments</span>
        </div>

        <div class="stat-card card-emerald saas-card">
          <div class="stat-card-top">
            <div class="stat-icon-box icon-emerald">
              <svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 20V10M12 20V4M6 20v-6"></path>
              </svg>
            </div>
            <span class="stat-title">Avg. Score</span>
          </div>
          <div class="stat-value">{{ getAvgScore() }}%</div>
          <span class="stat-subtext">Overall performance average</span>
        </div>

        <div class="stat-card card-amber saas-card">
          <div class="stat-card-top">
            <div class="stat-icon-box icon-amber">
              <svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
            </div>
            <span class="stat-title">Certificates</span>
          </div>
          <div class="stat-value">{{ summary()?.certificatesEarnedCount ?? 0 }}</div>
          <span class="stat-subtext">Passed completions</span>
        </div>
      </div>

      <!-- 🔥 Live Running Assessments & Ongoing Active Attempt -->
      @if (authService.userRole() !== 3) {
        <div class="content-card mb-4 running-quizzes-card print-hide">
        <div class="section-title-row">
          <div class="title-with-live-dot">
            <span class="live-status-pill"><span class="pulsing-dot"></span> LIVE ASSESSMENTS</span>
            <h3>🔥 Active Running Quizzes</h3>
            <p class="section-subtitle">Currently active assessments available for instant student participation</p>
          </div>
          <a routerLink="/quizzes/new" class="link-action">+ Launch New Assessment</a>
        </div>

        <!-- ONGOING IN-PROGRESS ATTEMPT BANNER (Persists until user clicks Submit) -->
        @if (ongoingAttempt()) {
          <div class="ongoing-attempt-alert saas-card mb-4">
            <div class="ongoing-alert-content">
              <div class="ongoing-badge-row mb-1">
                <span class="badge badge-warning">⚠️ ATTEMPT IN PROGRESS</span>
                <span class="ongoing-category-badge">{{ ongoingAttempt()?.category || 'Active Test' }}</span>
              </div>
              <h4 class="ongoing-title">{{ ongoingAttempt()?.quizTitle }}</h4>
              <p class="ongoing-desc">Your assessment session is running in the background. Tap below to resume before time expires.</p>
            </div>
            <div class="ongoing-right-box">
              <div class="ongoing-timer-display">
                <span class="timer-label">Time Remaining</span>
                <span class="timer-value">⏱️ {{ ongoingTimerText() }}</span>
              </div>
              <div class="ongoing-btn-row">
                <a [routerLink]="['/quiz', ongoingAttempt()?.quizId]" class="btn btn-ai btn-sm">
                  ➡️ Resume Quiz Attempt
                </a>
                <button (click)="cancelOngoingAttempt()" class="btn btn-outline btn-sm">
                  ✕ Dismiss
                </button>
              </div>
            </div>
          </div>
        }

        @if (isLoading()) {
          <div class="skeleton-wrapper">
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
          </div>
        } @else if (getLiveQuizzes().length === 0) {
          <div class="running-quiz-empty-banner">
            <div class="empty-banner-content">
              <h4>🚀 No Live Assessments</h4>
              <p>Create a quiz using AI, publish it, and it will show up here live for students to take.</p>
            </div>
            <a routerLink="/quizzes/new" [queryParams]="{topic: 'Full-Stack Web Development', auto: 'true'}" class="btn btn-primary">
              ✨ Quick Launch Web Assessment
            </a>
          </div>
        } @else {
          <div class="running-quizzes-grid">
            @for (q of getLiveQuizzes(); track q.id) {
              <div class="running-quiz-item-card saas-card">
                <div class="rq-header">
                  <span class="badge badge-emerald">🟢 ACTIVE LIVE</span>
                  <span class="rq-category">{{ q.category }}</span>
                </div>
                <h4 class="rq-title">{{ q.title }}</h4>
                <div class="rq-meta-row">
                  <span class="rq-meta-chip">📝 {{ q.questionCount }} Questions</span>
                  <span class="rq-meta-chip">⏱️ {{ q.timeLimitMinutes || 15 }} Mins</span>
                </div>

                <!-- Joined Students Count -->
                <div class="rq-join-status" [class.has-joins]="q.totalAttemptsCount > 0">
                  <div class="join-count-row">
                    <svg class="join-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    @if (q.totalAttemptsCount === 0) {
                      <span class="join-text waiting">Waiting for students...</span>
                    } @else {
                      <span class="join-text joined">
                        <strong>{{ q.totalAttemptsCount }}</strong> student{{ q.totalAttemptsCount > 1 ? 's' : '' }} attempted
                      </span>
                      @if (q.avgScorePercentage != null) {
                        <span class="join-avg">Avg: {{ q.avgScorePercentage }}%</span>
                      }
                    }
                  </div>
                </div>

                <!-- Cap Reached Banner -->
                @if (q.isCapReached) {
                  <div class="cap-reached-banner">
                    <div class="cap-banner-text">
                      <span class="cap-icon">🔒</span>
                      <div>
                        <strong>Student limit reached!</strong>
                        <span class="cap-count">{{ q.totalAttemptsCount }}/{{ q.maxStudents }} students completed</span>
                      </div>
                    </div>
                    @if ((q.limitExtensionCount || 0) < 2) {
                      <button (click)="extendQuizLimit(q)" class="btn btn-primary btn-sm cap-extend-btn">
                        ➕ Extend (+15) 
                        <span class="ext-count">{{ 2 - (q.limitExtensionCount || 0) }} left</span>
                      </button>
                    } @else {
                      <span class="cap-final-badge">🚫 Max extensions used</span>
                    }
                  </div>
                }

                <div class="rq-actions-row">
                  @if (authService.userRole() === 3) {
                    <a [routerLink]="['/quiz', q.id]" class="btn btn-primary btn-sm width-full" title="Start Assessment" style="text-align: center; justify-content: center;">
                      ▶️ Start Quiz
                    </a>
                  } @else {
                    @if (q.totalAttemptsCount > 0) {
                      <button (click)="openLeaderboardModal(q)" class="btn btn-ai btn-sm flex-grow" title="View Student Leaderboard">
                        🏆 Leaderboard
                      </button>
                    }
                    <button (click)="copyShareLink(q.shortId!)" class="btn btn-outline btn-sm flex-grow" title="Copy Direct Quiz Share Link">
                      📋 Share Link
                    </button>
                    <button (click)="deleteQuiz(q.id)" class="btn btn-outline btn-sm" title="Delete Assessment">
                      🗑️
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
      }

      <!-- Created Quizzes Data Table -->
      <div class="content-card mb-4">
        <div class="section-title-row">
          <div>
            @if (authService.userRole() !== 3) {
              <h3>Instructor Dashboard - Assessment History</h3>
              <p class="section-subtitle">Manage attempted assessments, view student scores, and leaderboard</p>
            } @else {
              <h3>My Custom Quizzes</h3>
              <p class="section-subtitle">Quizzes you have generated using AI</p>
            }
          </div>
          <a routerLink="/quizzes/new" class="link-action">+ Create New Quiz</a>
        </div>

        @if (isLoading()) {
          <div class="skeleton-wrapper">
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
          </div>
        } @else if (getHistoryQuizzes().length === 0) {
          <div class="empty-state-box">
            <div class="empty-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <h4>No assessment history yet</h4>
            <p>Quizzes will appear here once students start attempting them.</p>
          </div>
        } @else {
          <div class="quiz-table-wrapper">
            <table class="qp-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Category</th>
                  <th>Questions</th>
                  @if (authService.userRole() !== 3) {
                    <th>Submissions</th>
                    <th>Avg. Score</th>
                    <th>Status</th>
                  }
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (q of getHistoryQuizzes(); track q.id) {
                  <tr>
                    <td>
                      <div class="quiz-row-item">
                        <div class="q-icon-circle">📝</div>
                        <div class="q-info">
                          <span class="q-name">{{ q.title }}</span>
                          <span class="q-time">Created {{ q.createdAtUtc | date:'mediumDate' }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ q.category }}</td>
                    <td>{{ q.questionCount }} Items</td>
                    @if (authService.userRole() !== 3) {
                      <td>
                        <strong class="text-dark">{{ q.totalAttemptsCount }} Submissions</strong>
                      </td>
                      <td>
                        <strong class="text-dark">{{ q.avgScorePercentage }}%</strong>
                      </td>
                      <td>
                        @if (q.isPublished) {
                          <span class="badge badge-emerald">Published</span>
                        } @else {
                          <span class="badge badge-slate">Draft</span>
                        }
                      </td>
                    }
                    <td>
                      <div class="action-btns-row">
                        <a [routerLink]="['/quiz', q.id]" class="btn btn-ai btn-sm" title="Open Quiz">
                          ▶️ Open
                        </a>
                        @if (authService.userRole() !== 3) {
                          <button (click)="openLeaderboardModal(q)" class="btn btn-outline btn-sm" title="View Student Submissions & Leaderboard">
                            🏆 Leaderboard
                          </button>
                          <button (click)="copyShareLink(q.shortId!)" class="btn btn-outline btn-sm">
                            📋 Link
                          </button>
                          <a [routerLink]="['/quiz', q.id, 'edit']" class="btn btn-outline btn-sm">
                            Edit
                          </a>
                        }
                        <button (click)="deleteQuiz(q.id)" class="btn btn-outline btn-sm" title="Delete Assessment">
                          🗑️
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

      <!-- Recent Attempt History Table -->
      @if (authService.userRole() === 3 || (summary()?.myAttempts?.length ?? 0) > 0) {
        <div class="content-card">
          <div class="section-title-row">
            <div>
              <h3>My Quiz Attempt History</h3>
              <p class="section-subtitle">Your recent completed assessment attempts and scores</p>
            </div>
            <a routerLink="/student/progress" class="link-action">View Full History →</a>
          </div>

          @if (isLoading()) {
            <div class="skeleton-wrapper">
              <div class="skeleton-row"></div>
              <div class="skeleton-row"></div>
              <div class="skeleton-row"></div>
            </div>
          } @else if ((summary()?.myAttempts?.length ?? 0) === 0) {
            <div class="empty-state-box">
              <div class="empty-icon-wrapper">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
            <h4>No attempt history yet</h4>
            <p>You haven't completed any quizzes yet. Pick a suggestion topic above or open a quiz link to start.</p>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (a of summary()?.myAttempts; track a.id) {
                  <tr>
                    <td><strong class="text-dark">{{ a.quizTitle }}</strong></td>
                    <td>{{ a.submittedAtUtc | date:'mediumDate' }}</td>
                    <td>
                      <span class="score-pill" [class.score-high]="a.isPassed" [class.score-medium]="!a.isPassed">
                        {{ a.scorePercentage }}%
                      </span>
                    </td>
                    <td>
                      @if (a.isPassed) {
                        <span class="badge badge-emerald">Passed</span>
                      } @else {
                        <span class="badge badge-slate">Needs Review</span>
                      }
                    </td>
                    <td>
                      <div class="action-btns-row">
                        <a [routerLink]="['/quiz', a.quizId]" class="btn btn-primary btn-sm">
                          🔄 Retake Quiz
                        </a>
                        <button (click)="selectedReportAttempt.set(a)" class="btn btn-outline btn-sm">
                          📊 View Report
                        </button>
                        @if (a.isPassed) {
                          <a
                            [routerLink]="['/certificate/generator']"
                            [queryParams]="{ student: (authService.currentUser()?.firstName || 'Student') + ' ' + (authService.currentUser()?.lastName || ''), title: a.quizTitle, score: a.scorePercentage }"
                            class="btn btn-ai btn-sm"
                          >
                            📜 Certificate
                          </a>
                        }
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
    .dashboard-layout {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem 5rem 1.5rem;
    }
    .mb-1 { margin-bottom: 0.5rem; }
    .mb-2 { margin-bottom: 1.0rem; }
    .mb-3 { margin-bottom: 1.5rem; }
    .mb-4 { margin-bottom: 2.0rem; }
    .font-sm { font-size: 0.85rem; }
    .d-block { display: block; }
    .font-weight-bold { font-weight: 800; }
    .width-full { width: 100%; }
    .margin-top { margin-top: 1.25rem; }

    /* Adaptive Hero Banner */
    .dashboard-hero {
      padding: 2rem 2rem;
      background: var(--hero-bg);
      border: 1px solid var(--hero-border);
      border-radius: var(--radius-lg);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;
    }
    .hero-content {
      flex: 1;
      min-width: 0;
      z-index: 1;
      h1 {
        font-size: clamp(1.5rem, 4vw, 2.25rem);
        font-weight: 800;
        color: var(--hero-text) !important;
        letter-spacing: -0.025em;
        margin: 0 0 0.4rem 0;
        line-height: 1.2;
      }
      .hero-desc {
        font-size: 0.9rem;
        color: var(--hero-desc) !important;
        line-height: 1.55;
        margin: 0;
      }
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-sm);
      background: var(--hero-badge-bg);
      color: var(--hero-badge-color) !important;
      border: 1px solid var(--hero-badge-border);
    }
    .hero-actions {
      flex-shrink: 0;
      z-index: 1;
      .hero-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.95rem 1.75rem;
        background: var(--gradient-ai);
        color: #ffffff !important;
        font-weight: 800;
        font-size: 0.95rem;
        border-radius: var(--radius-md);
        text-decoration: none !important;
        box-shadow: var(--shadow-ai);
        transition: all 0.15s ease;
        &:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
          text-decoration: none !important;
        }
      }
    }

    .toast-notification {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 1100;
      background: var(--text-primary);
      color: var(--bg-surface);
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    }

    /* Suggestion Command Toolbar */
    .suggestion-toolbar {
      padding: 1.5rem 2rem;
      border-left: 5px solid var(--color-ai-purple) !important;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
    }
    .suggestion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .suggestion-title-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .ai-spark-circle {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: var(--color-ai-bg);
      border: 1px solid var(--color-ai-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.0rem;
    }
    .suggestion-title {
      font-size: 0.925rem;
      font-weight: 800;
      color: var(--text-primary) !important;
    }
    .suggestion-desc {
      font-size: 0.8rem;
      color: var(--text-muted) !important;
      margin: 0.1rem 0 0 0;
    }
    .topic-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      margin-top: 0.75rem;
    }
    .topic-pill {
      font-size: 0.825rem;
      font-weight: 700;
      padding: 0.5rem 1.0rem;
      border-radius: var(--radius-md);
      text-decoration: none !important;
      border: 1px solid var(--border-hairline);
      transition: all 0.15s ease;
      cursor: pointer;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
        text-decoration: none !important;
      }
    }
    .pill-ai      { background: var(--color-ai-bg); color: var(--color-ai-purple) !important; border-color: var(--color-ai-border); }
    .pill-indigo  { background: var(--color-primary-50); color: var(--color-primary-600) !important; border-color: var(--color-primary-200); }
    .pill-emerald { background: var(--color-success-bg); color: var(--color-success-text) !important; border-color: var(--color-success-border); }
    .pill-slate   { background: var(--bg-hover); color: var(--text-body) !important; border-color: var(--border-hairline); }

    /* Stats Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }
    .stat-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      &:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-md);
      }
    }
    .card-indigo { border-top: 4px solid var(--color-primary-600) !important; }
    .card-purple { border-top: 4px solid var(--color-ai-purple) !important; }
    .card-emerald{ border-top: 4px solid var(--color-success-text) !important; }
    .card-amber  { border-top: 4px solid #b45309 !important; }

    .stat-card-top {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }
    .stat-icon-box {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .stat-svg { width: 20px; height: 20px; }
    }
    .icon-indigo { background: var(--color-primary-50); color: var(--color-primary-600); }
    .icon-purple { background: var(--color-ai-bg); color: var(--color-ai-purple); }
    .icon-emerald { background: var(--color-success-bg); color: var(--color-success-text); }
    .icon-amber  { background: var(--color-warning-bg); color: var(--color-warning-text); }

    .stat-title {
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--text-secondary) !important;
    }
    .stat-value {
      font-size: 2.15rem;
      font-weight: 800;
      color: var(--text-primary) !important;
      line-height: 1.1;
    }
    .stat-subtext {
      font-size: 0.75rem;
      color: var(--text-muted) !important;
      margin-top: 0.35rem;
      font-weight: 500;
    }

    /* Running Live Quizzes Grid Section */
    .running-quizzes-card {
      border-top: 3px solid var(--color-success-text) !important;
    }
    .title-with-live-dot {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .live-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--color-success-text) !important;
      letter-spacing: 0.6px;
    }
    @keyframes pulseDot {
      0% { transform: scale(0.95); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.5; }
      100% { transform: scale(0.95); opacity: 1; }
    }
    .pulsing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-success-text);
      display: inline-block;
      animation: pulseDot 1.8s infinite ease-in-out;
    }
    .ai-loading-sparkles {
      font-size: 1.5rem;
      animation: pulse-glow 1.5s infinite alternate;
    }

    /* Scorecard specific styles */
    .scorecard-modal-content {
      max-width: 850px !important;
      width: 95% !important;
      max-height: 90vh !important;
    }
    .scorecard-body {
      background-color: var(--bg-surface);
      color: var(--text-primary);
    }
    .scorecard-header {
      padding: 1.5rem;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 1.5rem;
    }
    .scorecard-brand h2 {
      margin: 0;
      color: var(--color-primary);
      font-weight: 800;
    }
    .scorecard-brand h3 {
      margin: 0.5rem 0 1.5rem 0;
      color: var(--text-secondary);
    }
    .scorecard-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }
    .sc-info-box strong {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
      font-size: 1.1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.25rem;
    }
    .sc-score-box {
      text-align: center;
      background: var(--bg-default);
      padding: 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .sc-score-label {
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }
    .sc-score-val {
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--color-error);
    }
    .sc-score-val.passed {
      color: var(--color-success);
    }
    .sc-score-sub {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .sc-question-item {
      background: var(--bg-default);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1rem;
    }
    .sc-question-item.correct {
      border-left: 5px solid var(--color-success);
    }
    .sc-question-item.incorrect {
      border-left: 5px solid var(--color-error);
    }
    .sc-q-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .sc-q-num {
      font-weight: 800;
      color: var(--color-primary);
      background: var(--color-primary-light);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .sc-q-text {
      flex: 1;
      font-weight: 600;
      font-size: 1.05rem;
      line-height: 1.5;
    }
    .sc-q-points {
      font-weight: 700;
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .sc-options-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-left: 2.5rem;
    }
    .sc-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
    }
    .sc-option.is-selected {
      background: var(--color-primary-light);
      border-color: var(--color-primary);
    }
    .sc-option.is-correct {
      background: rgba(34, 197, 94, 0.1);
      border-color: var(--color-success);
    }
    .sc-opt-indicator {
      width: 20px;
      text-align: center;
      font-weight: bold;
    }
    .sc-opt-text {
      flex: 1;
    }
    .sc-opt-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.4rem;
      border-radius: var(--radius-sm);
    }
    .sc-opt-badge.student-choice {
      background: var(--color-primary);
      color: white;
    }
    .sc-opt-badge.correct-choice {
      background: var(--color-success);
      color: white;
    }
    .sc-q-explanation {
      margin-top: 1rem;
      margin-left: 2.5rem;
      padding: 0.75rem;
      background: rgba(245, 158, 11, 0.1);
      border-left: 3px solid var(--color-warning);
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .print-show-inline {
      display: inline-block;
    }

    /* Print styles */
    @media print {
      body * {
        visibility: hidden;
      }
      .scorecard-modal-content, .scorecard-modal-content * {
        visibility: visible;
      }
      .scorecard-modal-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: white !important;
        color: black !important;
      }
      .print-hide {
        display: none !important;
      }
      .sc-question-item, .sc-option {
        page-break-inside: avoid;
        border: 1px solid #ccc !important;
      }
      /* Ensure colors print correctly */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* Ongoing In-Progress Attempt Alert Card */
    .ongoing-attempt-alert {
      padding: 1.35rem 1.6rem;
      background: var(--color-warning-bg);
      border: 1.5px solid var(--color-warning-border) !important;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.25rem;
    }
    .ongoing-badge-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .ongoing-category-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-warning-text) !important;
    }
    .ongoing-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary) !important;
      margin: 0.2rem 0;
    }
    .ongoing-desc {
      font-size: 0.85rem;
      color: var(--text-secondary) !important;
      margin: 0;
    }
    .ongoing-right-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.6rem;
      flex-shrink: 0;
    }
    .ongoing-timer-display {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      .timer-label { font-size: 0.7rem; font-weight: 700; color: var(--color-warning-text) !important; text-transform: uppercase; }
      .timer-value { font-size: 1.25rem; font-weight: 800; color: var(--color-warning-text) !important; font-family: monospace; }
    }
    .ongoing-btn-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .running-quiz-empty-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: var(--color-success-bg);
      border: 1px solid var(--color-success-border);
      gap: 1.0rem;
      h4 { font-size: 1.0rem; font-weight: 800; color: var(--color-success-text) !important; margin-bottom: 0.2rem; }
      p { font-size: 0.85rem; color: var(--text-body); margin: 0; }
    }
    .running-quizzes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .running-quiz-item-card {
      padding: 1.5rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
    }
    .rq-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .rq-category {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted) !important;
    }
    .rq-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text-primary) !important;
      margin: 0;
      line-height: 1.35;
    }
    .rq-meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .rq-meta-chip {
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      background: var(--bg-hover);
      color: var(--text-secondary) !important;
      border: 1px solid var(--border-hairline);
    }
    .rq-actions-row {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.35rem;
    }
    .flex-grow { flex: 1; }

    /* Join Status Section */
    .rq-join-status {
      display: flex;
      align-items: center;
      padding: 0.65rem 0.85rem;
      background: var(--bg-hover);
      border: 1px solid var(--border-hairline);
      border-radius: 0.5rem;
      transition: all 0.2s ease;
    }
    .rq-join-status.has-joins {
      background: var(--color-success-bg);
      border-color: var(--color-success-border);
    }
    .join-count-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }
    .join-icon {
      width: 16px;
      height: 16px;
      stroke: var(--text-muted);
      flex-shrink: 0;
    }
    .rq-join-status.has-joins .join-icon {
      stroke: var(--color-success);
    }
    .join-text {
      font-size: 0.825rem;
      font-weight: 600;
      flex: 1;
    }
    .join-text.waiting {
      color: var(--text-muted) !important;
      font-style: italic;
    }
    .join-text.joined {
      color: var(--color-success) !important;
    }
    .join-avg {
      font-size: 0.75rem;
      font-weight: 700;
      background: white;
      border: 1px solid var(--color-success-border);
      color: var(--color-success) !important;
      padding: 0.1rem 0.45rem;
      border-radius: 99px;
    }

    /* Cap Reached Banner */
    .cap-reached-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #fff8ed;
      border: 1px solid #f59e0b;
      border-radius: 0.5rem;
      animation: pulse-warn 2s infinite;
    }
    @keyframes pulse-warn {
      0%, 100% { border-color: #f59e0b; }
      50% { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }
    }
    .cap-banner-text {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex: 1;
    }
    .cap-icon { font-size: 1.25rem; flex-shrink: 0; }
    .cap-banner-text strong { display: block; font-size: 0.875rem; color: #92400e !important; }
    .cap-count { font-size: 0.775rem; color: #92400e !important; opacity: 0.8; }
    .cap-extend-btn { white-space: nowrap; flex-shrink: 0; }
    .ext-count {
      font-size: 0.7rem;
      background: rgba(255,255,255,0.4);
      padding: 0.1rem 0.35rem;
      border-radius: 99px;
      margin-left: 0.3rem;
    }
    .cap-final-badge {
      font-size: 0.775rem;
      font-weight: 700;
      color: var(--color-danger) !important;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .label-hint {
      display: block;
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    /* Content Cards */
    .content-card {
      padding: 2rem;
      border-radius: var(--radius-lg);
    }
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1.5rem;
      h3 { font-size: 1.15rem; font-weight: 800; color: var(--text-primary) !important; margin: 0; }
      .section-subtitle { font-size: 0.85rem; color: var(--text-muted) !important; margin-top: 0.2rem; font-weight: 400; }
    }
    .link-action {
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--color-primary-600) !important;
      text-decoration: none !important;
      &:hover {
        text-decoration: none !important;
        color: var(--color-primary-700) !important;
      }
    }

    /* Table */
    .quiz-table-wrapper { overflow-x: auto; }
    .quiz-row-item { display: flex; align-items: center; gap: 0.75rem; }
    .q-icon-circle {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-sm);
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .q-info { display: flex; flex-direction: column; .q-name { font-weight: 700; color: var(--text-primary) !important; } .q-time { font-size: 0.75rem; color: var(--text-muted) !important; font-weight: 400; } }
    .text-dark { color: var(--text-primary) !important; }
    .action-btns-row { display: flex; gap: 0.4rem; align-items: center; }

    .score-pill { font-size: 0.8rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: var(--radius-sm); }
    .score-high { background: var(--color-success-bg); color: var(--color-success-text) !important; border: 1px solid var(--color-success-border); }
    .score-medium { background: var(--color-warning-bg); color: var(--color-warning-text) !important; border: 1px solid var(--color-warning-border); }

    /* Cheating row highlight */
    .cheat-row td { background: rgba(239, 68, 68, 0.04) !important; }
    .cheat-row { outline: 1px solid rgba(239, 68, 68, 0.2); }
    .cheat-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      background: var(--color-danger-bg);
      color: var(--color-danger) !important;
      border: 1px solid var(--color-danger-border);
      margin-left: 0.4rem;
      vertical-align: middle;
      letter-spacing: 0.3px;
    }

    /* Admin Leaderboard Modal */
    .modal-lg { max-width: 820px !important; }
    .modal-header-title {
      h3 { font-size: 1.35rem; font-weight: 800; color: var(--text-primary) !important; margin: 0; }
    }
    .leaderboard-modal-body {
      max-height: 65vh;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 0.5rem;
    }
    .leaderboard-meta-banner {
      display: flex;
      justify-content: space-around;
      padding: 1.0rem;
      background: var(--bg-app);
      border: 1px solid var(--border-hairline);
      .meta-item { display: flex; flex-direction: column; align-items: center; }
      .meta-label { font-size: 0.725rem; font-weight: 700; color: var(--text-muted) !important; text-transform: uppercase; }
      .meta-val { font-size: 1.15rem; font-weight: 800; margin-top: 0.1rem; }
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3px 8px;
      font-size: 0.75rem;
      font-weight: 800;
      background: var(--bg-hover);
      color: var(--text-secondary);
      border: 1px solid var(--border-hairline);
    }
    .rank-1 { background: #fef3c7; color: #b45309 !important; border-color: #fde68a; }
    .rank-2 { background: #f1f5f9; color: #475569 !important; border-color: #cbd5e1; }
    .rank-3 { background: #ffedd5; color: #c2410c !important; border-color: #fed7aa; }
    .score-num-text { font-size: 1.05rem; color: var(--color-primary-600) !important; }
    .modal-footer-row { display: flex; justify-content: flex-end; }

    /* Modal Backdrop & Report Dialog */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-content {
      width: 100%;
      max-width: 480px;
      border-radius: var(--radius-lg);
      padding: 1.75rem;
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
      border-radius: var(--radius-md);
      padding: 0.85rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      .stat-label { font-size: 0.725rem; font-weight: 700; color: var(--text-muted) !important; text-transform: uppercase; }
      .stat-num { font-size: 1.35rem; font-weight: 800; }
    }
    .text-primary { color: var(--color-primary-600) !important; }
    .text-success { color: var(--color-success-text) !important; }
    .text-danger { color: var(--color-danger-text) !important; }
    .width-full { width: 100%; }

    /* Scorecard Specific Styles */
    .scorecard-modal-content {
      max-height: 90vh;
      overflow-y: auto;
    }
    .scorecard-header { margin-bottom: 2rem; border-bottom: 1px solid var(--border-hairline); padding-bottom: 1.5rem; }
    .scorecard-brand h2 { font-size: 1.25rem; font-weight: 800; color: var(--color-primary-600) !important; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .scorecard-brand h3 { font-size: 1.5rem; font-weight: 800; margin: 0.5rem 0 1.5rem 0; color: var(--text-heading) !important; }
    .scorecard-summary-grid { display: grid; grid-template-columns: 1fr 1fr auto; gap: 1.5rem; }
    .sc-info-box { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; }
    .sc-info-box strong { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 0.25rem; }
    .sc-score-box { background: var(--bg-hover); padding: 1.0rem 1.5rem; border: 1px solid var(--border-hairline); text-align: center; display: flex; flex-direction: column; justify-content: center; }
    .sc-score-label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .sc-score-val { font-size: 2.25rem; font-weight: 900; line-height: 1; margin: 0.5rem 0; color: var(--color-danger-text); }
    .sc-score-val.passed { color: var(--color-success-text); }
    .sc-score-sub { font-size: 0.85rem; color: var(--text-muted); font-weight: 700; }
    
    .scorecard-questions h4 { font-size: 1.15rem; font-weight: 800; margin-bottom: 1.25rem; color: var(--text-heading); }
    .sc-question-item { background: var(--bg-surface); border: 1px solid var(--border-strong); margin-bottom: 1.25rem; padding: 1.25rem; }
    .sc-question-item.correct { border-color: var(--color-success-border); border-left: 4px solid var(--color-success-text); }
    .sc-question-item.incorrect { border-color: var(--color-danger-border); border-left: 4px solid var(--color-danger-text); }
    .sc-q-header { display: flex; gap: 1.0rem; align-items: flex-start; margin-bottom: 1.25rem; }
    .sc-q-num { font-size: 0.85rem; font-weight: 800; color: var(--color-primary-600); background: var(--color-primary-50); padding: 0.2rem 0.5rem; }
    .sc-q-text { font-size: 1.05rem; font-weight: 700; color: var(--text-heading); flex: 1; line-height: 1.4; margin: 0; }
    .sc-q-points { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); white-space: nowrap; }
    
    .sc-options-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .sc-option { display: flex; align-items: center; gap: 1.0rem; padding: 0.75rem 1.0rem; background: var(--bg-hover); border: 1px solid var(--border-hairline); }
    .sc-option.is-correct { background: var(--color-success-bg); border-color: var(--color-success-border); }
    .sc-option.is-selected { border-color: var(--color-primary-600); }
    .sc-opt-indicator { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
    .sc-opt-text { flex: 1; font-size: 0.95rem; color: var(--text-body); }
    .sc-opt-badge { font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .student-choice { background: var(--color-primary-600); color: white; }
    .correct-choice { background: var(--color-success-text); color: white; }
    .sc-q-explanation { margin-top: 1.25rem; padding: 1.0rem; background: var(--bg-hover); border: 1px solid var(--border-hairline); font-size: 0.9rem; color: var(--text-body); border-left: 3px solid var(--color-primary-600); }

    @media print {
      html, body, .dashboard-layout { 
        background: white !important; 
        margin: 0 !important; 
        padding: 0 !important; 
        height: auto !important; 
        overflow: visible !important; 
      }
      
      .scorecard-backdrop {
        position: static !important;
        background: transparent !important;
        display: block !important;
        padding: 0 !important;
        height: auto !important;
        inset: auto !important;
      }
      
      .scorecard-modal-content {
        position: static !important;
        width: 100% !important;
        max-width: 100% !important;
        max-height: none !important;
        overflow: visible !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: white !important;
        margin: 0 !important;
      }
      
      .print-hide { display: none !important; }
      .print-show-inline { display: inline !important; }
      
      .sc-question-item {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }


    @media (max-width: 1024px) {
      .metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    }

    @media (max-width: 900px) {
      .dashboard-layout { padding: 1.25rem 1rem 3rem 1rem; }
      .dashboard-hero {
        flex-direction: column;
        align-items: flex-start;
        padding: 1.5rem 1.5rem;
        gap: 1.25rem;
      }
      .hero-content h1 { font-size: 1.75rem; }
      .hero-actions { width: 100%; }
      .hero-btn { width: 100%; justify-content: center; text-align: center; display: flex; }
      .running-quiz-empty-banner { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .ongoing-attempt-alert { flex-direction: column; align-items: flex-start; }
      .ongoing-right-box { align-items: flex-start; width: 100%; }
      .ongoing-btn-row { flex-direction: column; gap: 0.5rem; }
      .ongoing-btn-row .btn { width: 100%; justify-content: center; }
      .scorecard-summary-grid { grid-template-columns: 1fr; }
      .leaderboard-meta-banner { flex-direction: column; gap: 1rem; }
      .section-title-row { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
      .link-action { align-self: flex-start; }
      .running-quizzes-grid { grid-template-columns: 1fr 1fr; gap: 0.875rem; }
    }

    @media (max-width: 640px) {
      .dashboard-layout { padding: 1rem 0.75rem 3rem 0.75rem; }
      .dashboard-hero { padding: 1.5rem 1.25rem; gap: 1rem; border-radius: var(--radius-md); }
      .hero-content h1 { font-size: 1.5rem; line-height: 1.3; }
      .hero-desc { font-size: 0.9rem !important; }
      
      /* Create square box layout for stats on small screens instead of wide thin lines */
      .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.75rem !important; }
      .stat-card { padding: 1.15rem !important; display: flex !important; align-items: flex-start !important; justify-content: center !important; flex-direction: column !important; }
      .stat-card-top { margin-bottom: 0.5rem !important; }
      .stat-value { font-size: 1.5rem !important; text-align: left !important; line-height: 1.1 !important; margin-bottom: 0.25rem !important; }
      .stat-subtext { text-align: left !important; margin-top: 0 !important; font-size: 0.7rem !important; line-height: 1.2 !important; }
      
      .topic-pills-row {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 0.75rem;
        gap: 0.5rem;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .topic-pills-row::-webkit-scrollbar { display: none; }
      .topic-pill { flex-shrink: 0; padding: 0.4rem 0.85rem; }
      
      .running-quizzes-grid { grid-template-columns: 1fr; gap: 1rem; }
      .quiz-table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: var(--radius-md); border: 1px solid var(--border-hairline); }
      .qp-table { min-width: 650px; } /* Ensure table has enough space to not cramp text */
      
      .content-card { padding: 1.25rem 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; }
      .running-quiz-item-card { padding: 1.25rem !important; }
      
      .rq-actions-row { flex-direction: column; gap: 0.5rem; width: 100%; }
      .rq-actions-row .btn, .rq-actions-row a { width: 100%; justify-content: center; text-align: center; }
      
      .action-btns-row { flex-direction: column; gap: 0.5rem; width: 100%; }
      .action-btns-row .btn, .action-btns-row a { width: 100%; justify-content: center; text-align: center; }
      
      .suggestion-toolbar { display: none !important; }
      .modal-content { padding: 1.5rem 1.25rem !important; max-width: 95% !important; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  readonly summary = signal<UserQuizDashboardSummary | null>(null);
  readonly isLoading = signal(true);
  readonly showToast = signal(false);
  readonly selectedReportAttempt = signal<UserAttemptItem | null>(null);
  readonly ongoingAttempt = signal<any | null>(null);
  readonly ongoingTimerText = signal<string>('');

  readonly selectedLeaderboardQuiz = signal<UserQuizItem | null>(null);
  readonly leaderboardItems = signal<QuizLeaderboardItem[]>([]);
  readonly isLeaderboardLoading = signal(false);

  readonly showScorecardModal = signal(false);
  readonly isScorecardLoading = signal(false);
  readonly selectedAttemptDetails = signal<AdminAttemptDetails | null>(null);

  private ongoingInterval: any = null;

  ngOnInit(): void {
    this.fetchDashboardSummary();
    this.checkOngoingAttempt();
  }

  ngOnDestroy(): void {
    if (this.ongoingInterval) {
      clearInterval(this.ongoingInterval);
    }
  }

  fetchDashboardSummary(): void {
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

  checkOngoingAttempt(): void {
    const raw = localStorage.getItem('qp_active_ongoing_attempt');
    if (!raw) {
      this.ongoingAttempt.set(null);
      return;
    }

    try {
      const active = JSON.parse(raw);
      const elapsedSeconds = Math.floor((Date.now() - active.startTime) / 1000);
      const timeLimitMins = active.timeLimitMinutes || 15;
      const remainingSeconds = (timeLimitMins * 60) - elapsedSeconds;

      if (remainingSeconds > 0) {
        this.ongoingAttempt.set(active);
        this.updateOngoingTimerText(remainingSeconds);

        if (this.ongoingInterval) clearInterval(this.ongoingInterval);
        this.ongoingInterval = setInterval(() => {
          const currentElapsed = Math.floor((Date.now() - active.startTime) / 1000);
          const currentRemaining = (timeLimitMins * 60) - currentElapsed;
          if (currentRemaining <= 0) {
            clearInterval(this.ongoingInterval);
            this.ongoingAttempt.set(null);
            localStorage.removeItem('qp_active_ongoing_attempt');
          } else {
            this.updateOngoingTimerText(currentRemaining);
          }
        }, 1000);
      } else {
        localStorage.removeItem('qp_active_ongoing_attempt');
        this.ongoingAttempt.set(null);
      }
    } catch (e) {
      localStorage.removeItem('qp_active_ongoing_attempt');
      this.ongoingAttempt.set(null);
    }
  }

  cancelOngoingAttempt(): void {
    if (this.ongoingInterval) clearInterval(this.ongoingInterval);
    localStorage.removeItem('qp_active_ongoing_attempt');
    this.ongoingAttempt.set(null);
  }

  private updateOngoingTimerText(remainingSecs: number): void {
    const m = Math.floor(remainingSecs / 60);
    const s = remainingSecs % 60;
    this.ongoingTimerText.set(`${m}:${s < 10 ? '0' : ''}${s}`);
  }

  getLiveQuizzes(): UserQuizItem[] {
    const list = this.summary()?.myQuizzes ?? [];
    return list.filter(q => q.isPublished);
  }

  getHistoryQuizzes(): UserQuizItem[] {
    const list = this.summary()?.myQuizzes ?? [];
    return list.filter(q => q.totalAttemptsCount > 0);
  }

  getTotalAttempts(): number {
    const fromSummary = this.summary()?.totalAttemptsCount ?? 0;
    if (fromSummary > 0) return fromSummary;
    // Fallback: sum from individual quizzes
    return (this.summary()?.myQuizzes ?? []).reduce((acc, q) => acc + (q.totalAttemptsCount || 0), 0);
  }

  getAvgScore(): number {
    const fromSummary = this.summary()?.avgScorePercentage ?? 0;
    if (fromSummary > 0) return fromSummary;
    // Fallback: weighted average from individual quizzes
    const quizzes = (this.summary()?.myQuizzes ?? []).filter(q => q.totalAttemptsCount > 0);
    if (quizzes.length === 0) return 0;
    const totalWeighted = quizzes.reduce((acc, q) => acc + (q.avgScorePercentage || 0) * q.totalAttemptsCount, 0);
    const totalAttempts = quizzes.reduce((acc, q) => acc + q.totalAttemptsCount, 0);
    return totalAttempts > 0 ? Math.round(totalWeighted / totalAttempts) : 0;
  }

  isWithinOneHour(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    return diffHours <= 1;
  }

  deleteQuiz(id: string): void {
    if(confirm('Are you sure you want to delete this assessment?')) {
      this.quizService.deleteQuiz(id).subscribe({
        next: () => {
          this.fetchDashboardSummary();
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }

  getCorrectCount(scorePercentage: number): number {
    return Math.round((scorePercentage / 100) * 10);
  }

  getWrongCount(scorePercentage: number): number {
    return 10 - this.getCorrectCount(scorePercentage);
  }

  editQuiz(quizId: string): void {
    this.router.navigate(['/quiz', quizId, 'edit']);
  }

  copyShareLink(shortId: string): void {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const defaultOrigin = `${protocol}//${host}${port}`;
    const env = (window as any).__env__ || null;
    const devOverride = env?.devHostOverride || null;
    const origin = (host === 'localhost' || host === '127.0.0.1') && devOverride ? devOverride : defaultOrigin;
    const url = `${origin}/q/${shortId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast.set(true);
      setTimeout(() => this.showToast.set(false), 3000);
    });
  }

  // --- SCORECARD METHODS ---
  viewAttemptScorecard(attempt: QuizLeaderboardItem): void {
    this.isScorecardLoading.set(true);
    this.showScorecardModal.set(true);
    this.quizService.getAttemptDetails(attempt.attemptId).subscribe({
      next: (details: AdminAttemptDetails) => {
        this.selectedAttemptDetails.set(details);
        this.isScorecardLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load attempt details', err);
        this.isScorecardLoading.set(false);
      }
    });
  }

  closeScorecardModal(): void {
    this.showScorecardModal.set(false);
    setTimeout(() => this.selectedAttemptDetails.set(null), 200);
  }

  printScorecard(): void {
    window.print();
  }

  extendQuizLimit(quiz: UserQuizItem): void {
    if ((quiz.limitExtensionCount ?? 0) >= 2) return;
    this.quizService.extendQuizLimit(quiz.id).subscribe({
      next: (res) => {
        this.fetchDashboardSummary();
        alert(`✅ ${res.message}`);
      },
      error: (err) => {
        alert(`❌ Failed to extend limit: ${err.error?.message || 'Unknown error'}`);
      }
    });
  }
}


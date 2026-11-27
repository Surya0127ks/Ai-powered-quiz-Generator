import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { QuizService } from '../../core/services/quiz.service';
import { copyTextToClipboard } from '../../core/utils/clipboard';
import { formatDurationSeconds } from '../../core/utils/format-duration';
import { UserRole } from '../../core/models/auth.model';
import { UserQuizDashboardSummary, UserAttemptItem, UserQuizItem, QuizLeaderboardItem, AdminAttemptDetails } from '../../core/models/quiz.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-layout">
      <!-- Overview Header -->
      <header class="dashboard-hero saas-card mb-4 print-hide">
        <div class="hero-content">
          <div class="hero-badge-row mb-2">
            <span class="hero-badge">{{ isStudent() ? 'Student workspace' : 'Assessment workspace' }}</span>
            @if (canManageQuizzes()) {
              <span class="role-chip">Teacher</span>
            } @else if (authService.userRole() === UserRole.Student) {
              <span class="role-chip">Student</span>
            }
          </div>
          <h1>{{ isStudent() ? 'Hello, ' : 'Welcome back, ' }}{{ authService.currentUser()?.firstName || 'Learner' }}</h1>
          <p class="hero-desc">
            @if (canManageQuizzes()) {
              Create assessments, share class links, and review submitted scorecards.
            } @else {
              Ready to practice? Draft an AI quiz, run an exam mock, or compare scores across attempts.
            }
          </p>
        </div>
        @if (canCreateQuizzes()) {
          <div class="hero-actions">
            <a routerLink="/quizzes/new" class="btn btn-primary hero-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              {{ isStudent() ? 'New practice quiz' : 'New AI quiz' }}
            </a>
            <a routerLink="/quizzes/new" [queryParams]="{ mode: 'govt' }" class="btn btn-secondary hero-btn hero-btn-govt">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M4 18h16M6 18V9m4 9V9m4 9V9m4 9V9M2 9l10-5 10 5H2z"/></svg>
              Exam hub
            </a>
          </div>
        }
      </header>

      <!-- Toast Notification -->
      @if (showToast()) {
        <div class="toast-notification print-hide" role="status" aria-live="polite">
          Shareable quiz link copied to clipboard
        </div>
      }
      @if (shareCopyFailed()) {
        <div class="toast-notification print-hide" role="alert">
          Could not copy the link. Open the quiz to select and copy it manually.
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
                <h3>Assessment scorecard</h3>
                <div style="display: flex; gap: 0.75rem; align-items: center;">
                  <button (click)="printScorecard()" class="btn btn-outline btn-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print scorecard
                  </button>
                  <button (click)="closeScorecardModal()" class="close-btn" aria-label="Close">✕</button>
                </div>
              </div>
              <div class="modal-body scorecard-body">
                <!-- Scorecard Header -->
                <div class="scorecard-header">
                  <div class="scorecard-brand">
                    <h2 class="print-show-inline">Quizzy AI Official Scorecard</h2>
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
                      <div>Status: <span [class.text-success]="selectedAttemptDetails()?.isPassed" [class.text-danger]="!selectedAttemptDetails()?.isPassed">{{ selectedAttemptDetails()?.isPassed ? 'Passed' : 'Needs review' }}</span></div>
                      <div>Time Taken: <strong>{{ formatDuration(selectedAttemptDetails()?.timeTakenSeconds) }}</strong></div>
                      <div>Focus Lost Flags: <strong class="text-danger">{{ selectedAttemptDetails()?.focusLostCount }}</strong></div>
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
                        @if (q.tag) {
                          <span class="sc-q-tag">{{ q.tag }}</span>
                        }
                        <span class="sc-q-text">{{ q.questionText }}</span>
                        <span class="sc-q-points">{{ q.pointsEarned }} / {{ q.points }} pts</span>
                      </div>
                      
                      <div class="sc-options-list">
                        @for (opt of q.options; track opt.optionId) {
                          <div class="sc-option" 
                               [class.is-correct]="opt.isCorrect" 
                               [class.is-selected]="q.selectedOptionIds.includes(opt.optionId)">
                            <div class="sc-opt-indicator" aria-hidden="true">
                              @if (opt.isCorrect) {
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              } @else if (q.selectedOptionIds.includes(opt.optionId) && !opt.isCorrect) {
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              } @else {
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/></svg>
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
              <h3>Performance summary</h3>
              <button (click)="selectedReportAttempt.set(null)" class="close-btn" aria-label="Close">✕</button>
            </div>
            <div class="report-modal-body">
              <div class="report-title-box mb-3">
                <span class="badge" [class.badge-emerald]="selectedReportAttempt()?.isPassed" [class.badge-slate]="!selectedReportAttempt()?.isPassed">
                  {{ selectedReportAttempt()?.isPassed ? 'Passed' : 'Needs review' }}
                </span>
                <h2>{{ selectedReportAttempt()?.quizTitle }}</h2>
                <p class="text-muted font-sm">Submitted {{ selectedReportAttempt()?.submittedAtUtc | date:'medium' }}</p>
              </div>

              <!-- Show only values available in this attempt summary. -->
              <div class="report-stats-grid mb-3">
                <div class="report-stat-box score">
                  <span class="stat-label">Final Score</span>
                  <span class="stat-num text-primary">{{ selectedReportAttempt()?.scorePercentage }}%</span>
                </div>
                <div class="report-stat-box">
                  <span class="stat-label">Outcome</span>
                  <span class="stat-num" [class.text-success]="selectedReportAttempt()?.isPassed" [class.text-danger]="!selectedReportAttempt()?.isPassed">
                    {{ selectedReportAttempt()?.isPassed ? 'Passed' : 'Not passed' }}
                  </span>
                </div>
                <div class="report-stat-box">
                  <span class="stat-label">Time Taken</span>
                  <span class="stat-num">{{ formatDuration(selectedReportAttempt()?.timeTakenSeconds) }}</span>
                </div>
              </div>

              <div class="report-actions margin-top">
                @if (selectedReportAttempt()?.isPassed) {
                  <a
                    [routerLink]="['/certificate/generator']"
                    [queryParams]="{ student: (authService.currentUser()?.firstName || 'Student') + ' ' + (authService.currentUser()?.lastName || ''), title: selectedReportAttempt()?.quizTitle, score: selectedReportAttempt()?.scorePercentage }"
                    class="btn btn-ai width-full mb-2 print-hide"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                    Issue certificate
                  </a>
                }
                <button onclick="window.print()" class="btn btn-outline width-full mb-2 print-hide">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Save result PDF
                </button>
                <button (click)="selectedReportAttempt.set(null)" class="btn btn-secondary width-full print-hide">Close</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ADMIN LEADERBOARD / STUDENT QUIZ ATTEMPTS MODAL -->
      @if (selectedLeaderboardQuiz() && !showScorecardModal()) {
        <div class="modal-backdrop" (click)="selectedLeaderboardQuiz.set(null)">
          <div class="modal-content modal-lg saas-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-title">
                <span class="modal-eyebrow mb-1">
                  {{ isStudent() ? 'My attempt progression' : 'Assessment leaderboard' }}
                </span>
                <h3>{{ selectedLeaderboardQuiz()?.title }}</h3>
              </div>
              <button (click)="selectedLeaderboardQuiz.set(null)" class="close-btn" aria-label="Close">✕</button>
            </div>
            <div class="leaderboard-modal-body">
              <div class="leaderboard-meta-banner mb-3">
                <div class="meta-item">
                  <span class="meta-label">{{ isStudent() ? 'Total Attempts' : 'Total Submissions' }}</span>
                  <strong class="meta-val">{{ leaderboardItems().length }} {{ isStudent() ? (leaderboardItems().length === 1 ? 'Attempt' : 'Attempts') : 'Students' }}</strong>
                </div>
                <div class="meta-item">
                  <span class="meta-label">{{ isStudent() ? 'Best Score' : 'Passed' }}</span>
                  @if (isStudent()) {
                    <strong class="meta-val text-success">{{ getStudentBestScore() }}%</strong>
                  } @else {
                    <strong class="meta-val text-success">{{ getLeaderboardPassedCount() }} ({{ getLeaderboardPassRate() }}%)</strong>
                  }
                </div>
                <div class="meta-item">
                  <span class="meta-label">{{ isStudent() ? 'Average Score' : 'Overall Avg Score' }}</span>
                  <strong class="meta-val text-primary">{{ selectedLeaderboardQuiz()?.avgScorePercentage }}%</strong>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Avg. Time Taken</span>
                  <strong class="meta-val">{{ formatDuration(getLeaderboardAvgTimeSeconds()) }}</strong>
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
                  <div class="empty-icon-wrapper">
                    @if (isStudent()) {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    } @else {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    }
                  </div>
                  <h4>{{ isStudent() ? 'No attempts recorded yet' : 'No student submissions yet' }}</h4>
                  @if (isStudent()) {
                    <p>Take this practice quiz to track your marks, time taken, and answer explanations across every retake.</p>
                    <a [routerLink]="['/quiz', selectedLeaderboardQuiz()?.id]" (click)="selectedLeaderboardQuiz.set(null)" class="btn btn-primary btn-sm">
                      Start practice test
                    </a>
                  } @else {
                    <p>Share this quiz link with your students. Submissions and rankings appear here once students complete the quiz.</p>
                    <button (click)="copyShareLink(selectedLeaderboardQuiz()!.shortId!)" class="btn btn-primary btn-sm">
                      Copy share link
                    </button>
                  }
                </div>
              } @else {
                <div class="quiz-table-wrapper">
                  <table class="qp-table">
                    <thead>
                      <tr>
                        @if (isStudent()) {
                          <th>Attempt</th>
                          <th>Marks</th>
                          <th>Score %</th>
                          <th>Time Taken</th>
                          <th>Outcome</th>
                          <th>Attempted On</th>
                          <th>Action</th>
                        } @else {
                          <th>Rank</th>
                          <th>Student Full Name</th>
                          <th>Contact / Email</th>
                          <th>Score</th>
                          <th>Time Taken</th>
                          <th>Outcome</th>
                          <th>Submitted At</th>
                          <th>Admin Action</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of leaderboardItems(); track item.attemptId) {
                        <tr [class.cheat-row]="item.isDisqualified">
                          @if (isStudent()) {
                            <td>
                              <span class="rank-badge">Attempt #{{ item.rank }}</span>
                            </td>
                            <td>
                              <strong class="score-num-text">{{ item.totalPointsEarned }} / {{ item.totalPossiblePoints }}</strong>
                              <small class="text-muted d-block">pts</small>
                            </td>
                            <td>
                              <strong class="score-num-text">{{ item.scorePercentage }}%</strong>
                            </td>
                            <td>{{ formatDuration(item.timeTakenSeconds) }}</td>
                            <td>
                              @if (item.isPassed) {
                                <span class="badge badge-emerald">Passed</span>
                              } @else {
                                <span class="badge badge-slate">Needs review</span>
                              }
                            </td>
                            <td>{{ item.submittedAtUtc | date:'short' }}</td>
                            <td>
                              <button (click)="viewAttemptScorecard(item)" class="btn btn-outline btn-sm" title="View Answers & Explanations">
                                Scorecard
                              </button>
                            </td>
                          } @else {
                            <td>
                              <span class="rank-badge" [class.rank-1]="item.rank === 1" [class.rank-2]="item.rank === 2" [class.rank-3]="item.rank === 3">
                                #{{ item.rank }}
                              </span>
                            </td>
                            <td>
                              <strong class="text-dark font-weight-bold">{{ item.studentName }}</strong>
                              @if (item.isDisqualified) {
                                <span class="cheat-badge">Disqualified</span>
                              }
                            </td>
                            <td class="text-muted">{{ item.studentEmail }}</td>
                            <td>
                              <strong class="score-num-text">{{ item.scorePercentage }}%</strong>
                              <small class="text-muted d-block">({{ item.totalPointsEarned }}/{{ item.totalPossiblePoints }} pts)</small>
                            </td>
                            <td>{{ formatDuration(item.timeTakenSeconds) }}</td>
                            <td>
                              @if (item.isDisqualified) {
                                <span class="badge badge-danger">Flagged</span>
                              } @else if (item.isPassed) {
                                <span class="badge badge-emerald">Passed</span>
                              } @else {
                                <span class="badge badge-slate">Needs review</span>
                              }
                              @if ((item.focusLostCount ?? 0) > 0 && !item.isDisqualified) {
                                <small class="text-muted d-block" style="color: var(--color-warning-text) !important;">{{ item.focusLostCount }} tab switch(es)</small>
                              }
                            </td>
                            <td>{{ item.submittedAtUtc | date:'short' }}</td>
                            <td>
                              <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <button (click)="viewAttemptScorecard(item)" class="btn btn-outline btn-sm" title="View Detailed Scorecard">
                                  Scorecard
                                </button>
                                @if (item.isPassed && !item.isDisqualified) {
                                  <a
                                    [routerLink]="['/certificate/generator']"
                                    [queryParams]="{ student: item.studentName, title: selectedLeaderboardQuiz()?.title, score: item.scorePercentage }"
                                    class="btn btn-ai btn-sm"
                                    title="Generate Certificate"
                                  >
                                    Certificate
                                  </a>
                                }
                              </div>
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <div class="modal-footer-row margin-top">
                @if (isStudent() && selectedLeaderboardQuiz()) {
                  <a [routerLink]="['/quiz', selectedLeaderboardQuiz()?.id]" (click)="selectedLeaderboardQuiz.set(null)" class="btn btn-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Retake quiz
                  </a>
                }
                <button (click)="selectedLeaderboardQuiz.set(null)" class="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (canCreateQuizzes()) {
      <!-- Quick topic starters -->
      <div class="suggestion-toolbar saas-card mb-4 print-hide">
        <div class="suggestion-header mb-2">
          <div class="suggestion-title-group">
            <span class="suggestion-title">Quick topic starters</span>
            <p class="suggestion-desc">Choose a subject to open a prefilled quiz draft.</p>
          </div>
        </div>
        <div class="topic-pills-row">
          <a routerLink="/quizzes/new" [queryParams]="{topic: 'Artificial Intelligence & Groq LLM', auto: 'true'}" class="topic-pill pill-cobalt">
            Artificial Intelligence & LLMs
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{topic: 'Full-Stack Web Development', auto: 'true'}" class="topic-pill pill-indigo">
            Web Development
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{topic: 'Python & Data Science', auto: 'true'}" class="topic-pill pill-emerald">
            Python & Data Science
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{topic: 'Cyber Security & Cloud', auto: 'true'}" class="topic-pill pill-teal">
            Cyber Security
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{topic: 'General Science & Tech', auto: 'true'}" class="topic-pill pill-amber">
            General Science
          </a>
        </div>
      </div>

      <!-- Government & Competitive Exam Preparation Hub Launcher -->
      <div class="govt-dashboard-hub saas-card mb-4 print-hide">
        <div class="govt-hub-header">
          <div class="govt-hub-title-group">
            <div class="govt-hub-title-row">
              <span class="govt-hub-title">Competitive exam preparation hub</span>
              <span class="govt-badge-cbt">7 exam streams</span>
            </div>
            <p class="govt-hub-desc">Build exam-pattern practice quizzes with configurable negative marking and section timers.</p>
          </div>
          <button
            type="button"
            class="btn-govt-explore"
            [attr.aria-expanded]="showGovernmentExamStreams()"
            (click)="toggleGovernmentExamStreams()"
          >
            {{ showGovernmentExamStreams() ? 'Hide streams' : 'Browse streams' }}
          </button>
        </div>
        @if (showGovernmentExamStreams()) {
          <div class="govt-stream-pills-row">
          <a routerLink="/quizzes/new" [queryParams]="{ mode: 'govt', exam: 'upsc' }" class="stream-pill" title="UPSC Civil Services Prelims GS & CSAT">
            UPSC Civil Services (IAS / IPS)
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{ mode: 'govt', exam: 'ssc' }" class="stream-pill" title="Staff Selection Commission CGL & CHSL">
            SSC CGL & CHSL (Tier 1 & 2)
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{ mode: 'govt', exam: 'banking' }" class="stream-pill" title="IBPS & SBI Probationary Officer & Clerk">
            Banking (IBPS / SBI PO)
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{ mode: 'govt', exam: 'railways' }" class="stream-pill" title="Railway Recruitment Board NTPC & Group D">
            Railways (RRB NTPC)
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{ mode: 'govt', exam: 'defence' }" class="stream-pill" title="National Defence Academy, Combined Defence Services">
            Defence (NDA / CDS / AFCAT)
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{ mode: 'govt', exam: 'teaching' }" class="stream-pill" title="Central Teacher Eligibility Test & State PSC">
            Teaching & State PSC (CTET)
          </a>
          <a routerLink="/quizzes/new" [queryParams]="{ mode: 'govt', exam: 'entrance' }" class="stream-pill" title="Pre-Medical & Pre-Engineering Entrance Exams">
            Entrance (NEET UG & JEE)
          </a>
          </div>
        }
      </div>

      }

      <!-- Key Performance Metrics Cards -->
      <div class="metrics-grid mb-4 print-hide">
        @if (canCreateQuizzes()) {
        <div class="stat-card tone-cobalt saas-card">
          <div class="stat-card-top">
            <span class="stat-dot dot-cobalt" aria-hidden="true"></span>
            <span class="stat-title">{{ isStudent() ? 'Practice quizzes' : 'Quizzes created' }}</span>
          </div>
          <div class="stat-value mono-num">{{ summary()?.quizzesCreatedCount ?? 0 }}</div>
          <span class="stat-subtext">
            {{ isStudent() ? 'Private self-study sets' : (summary()?.publishedCount ?? 0) + ' published · ' + (summary()?.draftsCount ?? 0) + ' drafts' }}
          </span>
        </div>
        }

        <div class="stat-card tone-teal saas-card">
          <div class="stat-card-top">
            <span class="stat-dot dot-teal" aria-hidden="true"></span>
            <span class="stat-title">Total attempts</span>
          </div>
          <div class="stat-value mono-num">{{ getTotalAttempts() }}</div>
          <span class="stat-subtext">Across your assessments</span>
        </div>

        <div class="stat-card tone-emerald saas-card">
          <div class="stat-card-top">
            <span class="stat-dot dot-emerald" aria-hidden="true"></span>
            <span class="stat-title">Average score</span>
          </div>
          <div class="stat-value mono-num">{{ getAvgScore() }}%</div>
          <span class="stat-subtext">Overall performance average</span>
        </div>

        <div class="stat-card tone-amber saas-card">
          <div class="stat-card-top">
            <span class="stat-dot dot-amber" aria-hidden="true"></span>
            <span class="stat-title">Certificates</span>
          </div>
          <div class="stat-value mono-num">{{ summary()?.certificatesEarnedCount ?? 0 }}</div>
          <span class="stat-subtext">Passed completions</span>
        </div>
      </div>

      <!-- Active Assessments / Student Practice Quizzes -->
      @if (canCreateQuizzes()) {
        <div class="content-card mb-4 running-quizzes-card print-hide">
        <div class="section-title-row">
          <div class="title-with-live-dot">
            @if (isStudent()) {
              <span class="live-status-pill"><span class="live-dot"></span> Self-study &amp; mock tests</span>
              <h3>My practice quizzes</h3>
              <p class="section-subtitle">Private AI &amp; exam mock tests for preparation (unlisted · unlimited retakes · auto-cleans after 24 hours)</p>
            } @else {
              <span class="live-status-pill"><span class="live-dot"></span> Live assessments</span>
              <h3>Active running quizzes</h3>
              <p class="section-subtitle">Live assessments (max 50 students per quiz · quiz &amp; attempt data auto-cleans after 24 hours)</p>
            }
          </div>
          <a routerLink="/quizzes/new" class="link-action">{{ isStudent() ? '+ New practice quiz' : '+ New assessment' }}</a>
        </div>

        <!-- Ongoing In-Progress Attempt Banner -->
        @if (ongoingAttempt()) {
          <div class="ongoing-attempt-alert saas-card mb-4">
            <div class="ongoing-alert-content">
              <div class="ongoing-badge-row mb-1">
                <span class="badge badge-warning">Attempt in progress</span>
                <span class="ongoing-category-badge">{{ ongoingAttempt()?.category || 'Active test' }}</span>
              </div>
              <h4 class="ongoing-title">{{ ongoingAttempt()?.quizTitle }}</h4>
              <p class="ongoing-desc">Your session is open. Resume before the timer expires.</p>
            </div>
            <div class="ongoing-right-box">
              <div class="ongoing-timer-display">
                <span class="timer-label">Time remaining</span>
                <span class="timer-value">{{ ongoingTimerText() }}</span>
              </div>
              <div class="ongoing-btn-row">
                <a [routerLink]="['/quiz', ongoingAttempt()?.quizId]" class="btn btn-primary btn-sm">
                  Resume quiz
                </a>
                <button (click)="cancelOngoingAttempt()" class="btn btn-outline btn-sm">
                  Dismiss
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
              <h4>{{ isStudent() ? 'No practice quizzes yet' : 'No live assessments yet' }}</h4>
              <p>
                {{ isStudent()
                  ? 'Generate a private AI study quiz or exam mock test above, attempt it anytime, and retake to raise your score.'
                  : 'Create a quiz using AI, publish it, and share the link for students to attempt.' }}
              </p>
            </div>
            <a routerLink="/quizzes/new" [queryParams]="{topic: 'Full-Stack Web Development', auto: 'true'}" class="btn btn-primary">
              {{ isStudent() ? 'Quick generate practice quiz' : 'Quick launch web quiz' }}
            </a>
          </div>
        } @else {
          <div class="running-quizzes-grid">
            @for (q of getLiveQuizzes(); track q.id) {
              <div class="running-quiz-item-card saas-card">
                <div class="rq-header">
                  @if (isStudent()) {
                    <span class="badge badge-slate">Private practice</span>
                  } @else {
                    <span class="badge badge-emerald"><span class="live-dot"></span> Live</span>
                  }
                  <span class="rq-category">{{ q.category }}</span>
                </div>
                <h4 class="rq-title">{{ q.title }}</h4>
                <div class="rq-meta-row">
                  <span class="rq-meta-chip mono-num">{{ q.questionCount }} Qs</span>
                  <span class="rq-meta-chip mono-num">{{ q.timeLimitMinutes || 15 }} min</span>
                  @if (!isStudent()) {
                    <span class="rq-meta-chip mono-num">{{ q.totalAttemptsCount }}/{{ q.maxStudents ?? 15 }} seats</span>
                  }
                </div>

                <!-- Joined Students & Quiz Analytics / Self-Attempt Summary -->
                <div class="rq-join-status" [class.has-joins]="q.totalAttemptsCount > 0">
                  <div class="join-count-row">
                    <svg class="join-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    @if (q.totalAttemptsCount === 0) {
                      <span class="join-text waiting">
                        {{ isStudent() ? 'Ready for practice — start Attempt #1' : 'Waiting for submissions' }}
                      </span>
                    } @else {
                      <span class="join-text joined">
                        @if (isStudent()) {
                          <strong class="mono-num">{{ q.totalAttemptsCount }}</strong> attempt{{ q.totalAttemptsCount > 1 ? 's' : '' }} completed
                        } @else {
                          <strong class="mono-num">{{ q.totalAttemptsCount }}</strong> student{{ q.totalAttemptsCount > 1 ? 's' : '' }} attempted
                        }
                      </span>
                      <span class="join-avg mono-num">Avg {{ q.avgScorePercentage }}%</span>
                    }
                  </div>
                  @if (q.totalAttemptsCount > 0) {
                    <div class="rq-analytics-pills">
                      <span class="rq-analytics-pill mono-num">{{ q.passedCount ?? 0 }}/{{ q.totalAttemptsCount }} passed ({{ q.passRatePercentage ?? 0 }}%)</span>
                      <span class="rq-analytics-pill mono-num">Avg time {{ formatDuration(q.avgTimeTakenSeconds) }}</span>
                    </div>
                  }
                </div>

                <!-- Cap Reached Banner (Educators only) -->
                @if (!isStudent() && q.isCapReached) {
                  <div class="cap-reached-banner">
                    <div class="cap-banner-text">
                      <span class="cap-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                      <div>
                        <strong>Student limit reached</strong>
                        <span class="cap-count mono-num">{{ q.totalAttemptsCount }}/{{ q.maxStudents }} students completed</span>
                      </div>
                    </div>
                    @if ((q.maxStudents ?? 15) < 50 && (q.limitExtensionCount || 0) < 2) {
                      <button (click)="extendQuizLimit(q)" class="btn btn-primary btn-sm cap-extend-btn">
                        Extend (+15)
                        <span class="ext-count">{{ 2 - (q.limitExtensionCount || 0) }} left</span>
                      </button>
                    } @else {
                      <span class="cap-final-badge">
                        {{ (q.maxStudents ?? 15) >= 50 ? 'Max 50 seats reached' : 'Max extensions used' }}
                      </span>
                    }
                  </div>
                }

                <div class="rq-actions-row">
                  @if (isStudent()) {
                    <a [routerLink]="['/quiz', q.id]" class="btn btn-primary btn-sm flex-grow" title="Practice or Retake Quiz" style="text-align: center; justify-content: center;">
                      {{ q.totalAttemptsCount > 0 ? 'Retake quiz' : 'Start practice' }}
                    </a>
                    @if (q.totalAttemptsCount > 0) {
                      <button (click)="openLeaderboardModal(q)" class="btn btn-secondary btn-sm flex-grow" title="View all your attempt marks for this quiz">
                        Attempts ({{ q.totalAttemptsCount }})
                      </button>
                    }
                    <a [routerLink]="['/quiz', q.id, 'edit']" class="btn btn-outline btn-sm btn-icon" title="Edit Questions" aria-label="Edit quiz">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </a>
                    <button (click)="deleteQuiz(q.id)" class="btn btn-outline btn-sm btn-icon" title="Delete Practice Quiz" aria-label="Delete quiz">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  } @else {
                    @if (q.totalAttemptsCount > 0) {
                      <button (click)="openLeaderboardModal(q)" class="btn btn-primary btn-sm flex-grow" title="View Student Leaderboard">
                        Leaderboard
                      </button>
                    }
                    <button (click)="copyShareLink(q.shortId!)" class="btn btn-outline btn-sm flex-grow" title="Copy Direct Quiz Share Link">
                      Copy link
                    </button>
                    <button (click)="deleteQuiz(q.id)" class="btn btn-outline btn-sm btn-icon" title="Delete Assessment" aria-label="Delete quiz">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
      }

      @if (canCreateQuizzes()) {
      <!-- Created Quizzes Data Table -->
      <div class="content-card mb-4">
        <div class="section-title-row">
          <div>
            @if (!isStudent()) {
              <h3>Instructor Dashboard - Assessment History</h3>
              <p class="section-subtitle">Manage attempted assessments, view student scores, and leaderboard</p>
            } @else {
              <h3>Practice Quiz Performance Summary</h3>
              <p class="section-subtitle">Compare your attempts, marks, and retest progress per quiz</p>
            }
          </div>
          <a routerLink="/quizzes/new" class="link-action">{{ isStudent() ? '+ Create Practice Quiz' : '+ Create New Quiz' }}</a>
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
            <h4>{{ isStudent() ? 'No attempted practice quizzes yet' : 'No assessment history yet' }}</h4>
            <p>
              {{ isStudent()
                ? 'Attempt any of your practice quizzes above to track marks and retest improvement here.'
                : 'Quizzes will appear here once students start attempting them.' }}
            </p>
          </div>
        } @else {
          <div class="quiz-table-wrapper">
            <table class="qp-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Category</th>
                  <th>Questions</th>
                  <th>{{ isStudent() ? 'Attempts' : 'Submissions' }}</th>
                  <th>Passed</th>
                  <th>Avg. Score</th>
                  <th>Avg. Time</th>
                  @if (!isStudent()) {
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
                        <div class="q-icon-circle" aria-hidden="true">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </div>
                        <div class="q-info">
                          <span class="q-name">{{ q.title }}</span>
                          <span class="q-time">Created {{ q.createdAtUtc | date:'mediumDate' }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ q.category }}</td>
                    <td class="mono-num">{{ q.questionCount }}</td>
                    <td>
                      <strong class="text-dark mono-num">{{ q.totalAttemptsCount }}</strong> {{ isStudent() ? (q.totalAttemptsCount === 1 ? 'attempt' : 'attempts') : 'submissions' }}
                    </td>
                    <td>
                      <strong class="text-dark mono-num">{{ q.passedCount ?? 0 }}/{{ q.totalAttemptsCount }}</strong>
                      <small class="text-muted d-block mono-num">{{ q.passRatePercentage ?? 0 }}% pass rate</small>
                    </td>
                    <td>
                      <strong class="text-dark mono-num">{{ q.avgScorePercentage }}%</strong>
                    </td>
                    <td class="mono-num">{{ formatDuration(q.avgTimeTakenSeconds) }}</td>
                    @if (!isStudent()) {
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
                        <a [routerLink]="['/quiz', q.id]" class="btn btn-primary btn-sm" [title]="isStudent() ? 'Retake Quiz' : 'Open Quiz'">
                          {{ isStudent() ? 'Retake' : 'Open' }}
                        </a>
                        <button (click)="openLeaderboardModal(q)" class="btn btn-outline btn-sm" [title]="isStudent() ? 'View All Attempt Marks' : 'View Student Submissions & Leaderboard'">
                          {{ isStudent() ? 'Attempts' : 'Leaderboard' }}
                        </button>
                        @if (!isStudent() && q.isPublished) {
                          <button (click)="copyShareLink(q.shortId!)" class="btn btn-outline btn-sm">
                            Link
                          </button>
                        }
                        <a [routerLink]="['/quiz', q.id, 'edit']" class="btn btn-outline btn-sm">
                          Edit
                        </a>
                        <button (click)="deleteQuiz(q.id)" class="btn btn-outline btn-sm btn-icon" title="Delete Assessment" aria-label="Delete assessment">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
      }

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
            @if (isStudent()) {
              <p>Create a private practice quiz above or open an assessment link shared by your teacher to get started.</p>
            } @else {
              <p>You haven't completed any quizzes yet. Open a published quiz link to preview the student experience.</p>
            }
          </div>
        } @else {
          <div class="quiz-table-wrapper">
            <table class="qp-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Submitted Date</th>
                  <th>Score</th>
                  <th>Time Taken</th>
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
                    <td>{{ formatDuration(a.timeTakenSeconds) }}</td>
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
                          Retake quiz
                        </a>
                        <button (click)="selectedReportAttempt.set(a)" class="btn btn-outline btn-sm">
                          Report
                        </button>
                        @if (a.isPassed) {
                          <a
                            [routerLink]="['/certificate/generator']"
                            [queryParams]="{ student: (authService.currentUser()?.firstName || 'Student') + ' ' + (authService.currentUser()?.lastName || ''), title: a.quizTitle, score: a.scorePercentage }"
                            class="btn btn-secondary btn-sm"
                          >
                            Certificate
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
    .font-weight-bold { font-weight: 500; }
    .width-full { width: 100%; }
    .margin-top { margin-top: 1.25rem; }
    .mono-num { font-variant-numeric: tabular-nums; }
    .btn-icon { width: 32px; height: 32px; padding: 0; justify-content: center; flex-shrink: 0; }

    /* Overview Header */
    .dashboard-hero {
      padding: 1.5rem 1.75rem;
      background: var(--surface-tint-blue);
      border: 1px solid var(--color-primary-200);
      border-left: 3px solid var(--color-primary-600);
      border-radius: var(--radius-lg);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      position: relative;
    }
    .hero-content {
      flex: 1;
      min-width: 0;
      z-index: 1;
      h1 {
        font-size: clamp(1.5rem, 2.6vw, 1.875rem);
        font-weight: 500;
        color: var(--text-primary) !important;
        letter-spacing: -0.025em;
        margin: 0 0 0.35rem 0;
        line-height: 1.2;
      }
      .hero-desc {
        font-size: 0.9375rem;
        color: var(--text-secondary) !important;
        line-height: 1.55;
        margin: 0;
      }
    }
    .hero-badge-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .role-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.15rem 0.5rem;
      border: 1px solid var(--border-hairline);
      border-radius: 6px;
      background: var(--bg-muted);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 500;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      background: var(--color-primary-50);
      color: var(--color-primary-700) !important;
      border: 1px solid var(--color-primary-200);
    }
    .hero-actions {
      flex-shrink: 0;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 0.625rem;
      .hero-btn {
        min-height: 40px;
      }
    }

    .toast-notification {
      position: fixed;
      top: 76px;
      right: 24px;
      z-index: 1100;
      background: var(--text-primary);
      color: var(--bg-surface);
      padding: 0.65rem 1.1rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: var(--shadow-md);
    }

    /* Quick Topic & Exam Hub */
    .suggestion-toolbar {
      padding: 1.25rem 1.5rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
    }
    .govt-dashboard-hub {
      padding: 1.25rem 1.5rem;
      background: var(--surface-tint-amber);
      border: 1px solid var(--color-warning-border);
      border-left: 3px solid var(--color-warning-text);
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
      flex-direction: column;
    }
    .suggestion-title,
    .govt-hub-title {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-primary) !important;
    }
    .suggestion-desc,
    .govt-hub-desc {
      font-size: 0.8125rem;
      color: var(--text-muted) !important;
      margin: 0.15rem 0 0 0;
    }
    .topic-pills-row,
    .govt-stream-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .topic-pill,
    .stream-pill {
      font-size: 0.8125rem;
      font-weight: 500;
      padding: 0.45rem 0.875rem;
      border-radius: var(--radius-md);
      text-decoration: none !important;
      border: 1px solid var(--border-hairline);
      background: var(--bg-surface);
      color: var(--text-primary) !important;
      transition: background-color 150ms var(--ease-out), border-color 150ms var(--ease-out), color 150ms var(--ease-out), filter 150ms var(--ease-out);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
    }
    .topic-pill.pill-cobalt { background: var(--color-primary-50); border-color: var(--color-primary-200); color: var(--color-primary-700) !important; }
    .topic-pill.pill-indigo { background: var(--color-indigo-bg); border-color: var(--color-indigo-border); color: var(--color-indigo-text) !important; }
    .topic-pill.pill-emerald { background: var(--color-success-bg); border-color: var(--color-success-border); color: var(--color-success-text) !important; }
    .topic-pill.pill-teal { background: var(--color-teal-bg); border-color: var(--color-teal-border); color: var(--color-teal-text) !important; }
    .topic-pill.pill-amber { background: var(--color-warning-bg); border-color: var(--color-warning-border); color: var(--color-warning-text) !important; }
    .topic-pill:hover { filter: brightness(0.96); }
    .stream-pill:hover {
      background: var(--color-warning-bg);
      border-color: var(--color-warning-border);
      color: var(--color-warning-text) !important;
    }

    .govt-hub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .govt-hub-title-group {
      display: flex;
      flex-direction: column;
    }
    .govt-hub-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .govt-badge-cbt {
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--color-warning-bg);
      color: var(--color-warning-text) !important;
      border: 1px solid var(--color-warning-border);
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }
    .btn-govt-explore {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-warning-text) !important;
      font-family: inherit;
      cursor: pointer;
      padding: 0.45rem 0.875rem;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--color-warning-border);
      transition: background-color 150ms var(--ease-out), border-color 150ms var(--ease-out);
      white-space: nowrap;
      &:hover {
        background: var(--color-warning-bg);
      }
    }

    /* Stats Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .stat-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      transition: border-color 150ms var(--ease-out);
      &:hover {
        border-color: var(--border-strong);
      }
    }
    .stat-card.tone-cobalt  { border-top: 2px solid var(--color-primary-600); }
    .stat-card.tone-teal    { border-top: 2px solid var(--color-teal-text); }
    .stat-card.tone-emerald { border-top: 2px solid var(--color-success-text); }
    .stat-card.tone-amber   { border-top: 2px solid var(--color-warning-text); }
    .stat-card-top {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.65rem;
    }
    .stat-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-cobalt  { background: var(--color-primary-600); }
    .dot-teal    { background: var(--color-teal-text); }
    .dot-emerald { background: var(--color-success-text); }
    .dot-amber   { background: var(--color-warning-text); }
    .stat-title {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-secondary) !important;
    }
    .stat-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.875rem;
      font-weight: 500;
      color: var(--text-primary) !important;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .stat-card.tone-cobalt .stat-value  { color: var(--color-primary-700) !important; }
    .stat-card.tone-teal .stat-value    { color: var(--color-teal-text) !important; }
    .stat-card.tone-emerald .stat-value { color: var(--color-success-text) !important; }
    .stat-card.tone-amber .stat-value   { color: var(--color-warning-text) !important; }
    .stat-subtext {
      font-size: 0.75rem;
      color: var(--text-muted) !important;
      margin-top: 0.5rem;
      font-weight: 400;
    }

    /* Active Quizzes Grid Section */
    .running-quizzes-card {
      background: var(--bg-surface);
      border-top: 2px solid var(--color-success-text) !important;
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
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-success-text) !important;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-success-text);
      display: inline-block;
      flex-shrink: 0;
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
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-hairline);
      margin-bottom: 1.25rem;
    }
    .scorecard-brand h2 {
      margin: 0;
      color: var(--color-primary-600);
      font-weight: 600;
    }
    .scorecard-brand h3 {
      margin: 0.5rem 0 1.25rem 0;
      color: var(--text-heading);
      font-weight: 500;
    }
    .scorecard-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 1.25rem;
    }
    .sc-info-box {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.85rem;
    }
    .sc-info-box strong {
      display: block;
      margin-bottom: 0.35rem;
      color: var(--text-primary);
      font-size: 0.8rem;
      font-weight: 600;
      border-bottom: 1px solid var(--border-hairline);
      padding-bottom: 0.25rem;
    }
    .sc-score-box {
      text-align: center;
      background: var(--bg-app);
      padding: 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-hairline);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .sc-score-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .sc-score-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 2rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      color: var(--color-danger-text);
      line-height: 1;
      margin: 0.35rem 0;
    }
    .sc-score-val.passed {
      color: var(--color-success-text);
    }
    .sc-score-sub {
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .scorecard-questions h4 { font-size: 1.05rem; font-weight: 500; margin-bottom: 1rem; color: var(--text-heading); }
    .sc-question-item {
      background: var(--bg-app);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      padding: 1.15rem;
      margin-bottom: 1rem;
    }
    .sc-question-item.correct {
      border-color: var(--color-success-border);
      border-left: 2px solid var(--color-success-text);
    }
    .sc-question-item.incorrect {
      border-color: var(--color-danger-border);
      border-left: 2px solid var(--color-danger-text);
    }
    .sc-q-header {
      display: flex;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 0.65rem 0.85rem;
      margin-bottom: 0.9rem;
    }
    .sc-q-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--color-primary-700);
      background: var(--color-primary-50);
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
    }
    .sc-q-tag {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      background: var(--bg-muted);
      border: 1px solid var(--border-hairline);
      border-radius: 6px;
      padding: 0.15rem 0.5rem;
      white-space: nowrap;
    }
    .sc-q-text {
      flex: 1;
      min-width: 180px;
      font-weight: 500;
      font-size: 0.96rem;
      line-height: 1.45;
      color: var(--text-heading);
    }
    .sc-q-points {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .sc-options-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .sc-option {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.65rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
    }
    .sc-option.is-selected {
      background: var(--color-primary-50);
      border-color: var(--color-primary-600);
    }
    .sc-option.is-correct {
      background: var(--color-success-bg);
      border-color: var(--color-success-border);
    }
    .sc-opt-indicator {
      width: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
    }
    .sc-option.is-correct .sc-opt-indicator {
      color: var(--color-success-text);
    }
    .sc-option.is-selected:not(.is-correct) .sc-opt-indicator {
      color: var(--color-danger-text);
    }
    .sc-opt-text {
      flex: 1;
      font-size: 0.92rem;
      color: var(--text-body);
    }
    .sc-opt-badge {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
    }
    .student-choice { background: var(--color-primary-600); color: #ffffff; }
    .correct-choice { background: var(--color-success-text); color: #ffffff; }
    .sc-q-explanation {
      margin-top: 0.85rem;
      padding: 0.75rem 1rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-left: 2px solid var(--color-primary-600);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      color: var(--text-body);
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
      padding: 1.25rem 1.5rem;
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning-border) !important;
      border-radius: var(--radius-md);
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
      font-weight: 500;
      color: var(--color-warning-text) !important;
    }
    .ongoing-title {
      font-size: 1.05rem;
      font-weight: 500;
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
      .timer-label { font-size: 0.75rem; font-weight: 500; color: var(--color-warning-text) !important; }
      .timer-value { font-size: 1.2rem; font-weight: 500; color: var(--color-warning-text) !important; font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
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
      padding: 1.25rem 1.5rem;
      background: var(--surface-tint-emerald);
      border: 1px solid var(--color-success-border);
      border-radius: var(--radius-md);
      gap: 1.0rem;
      h4 { font-size: 0.95rem; font-weight: 500; color: var(--color-success-text) !important; margin-bottom: 0.2rem; }
      p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
    }
    .running-quizzes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 1rem;
    }
    .running-quiz-item-card {
      padding: 1.25rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      transition: border-color 150ms var(--ease-out);
      &:hover {
        border-color: var(--border-strong);
      }
    }
    .rq-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    .rq-category {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted) !important;
    }
    .rq-title {
      font-size: 1rem;
      font-weight: 500;
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
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      background: var(--bg-muted);
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
      flex-direction: column;
      gap: 0.45rem;
      padding: 0.6rem 0.75rem;
      background: var(--bg-app);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      transition: background-color 150ms var(--ease-out), border-color 150ms var(--ease-out);
    }
    .rq-analytics-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .rq-analytics-pill {
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--text-secondary) !important;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
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
      width: 15px;
      height: 15px;
      stroke: var(--text-muted);
      flex-shrink: 0;
    }
    .rq-join-status.has-joins .join-icon {
      stroke: var(--color-success-text);
    }
    .join-text {
      font-size: 0.8125rem;
      font-weight: 500;
      flex: 1;
    }
    .join-text.waiting {
      color: var(--text-muted) !important;
    }
    .join-text.joined {
      color: var(--color-success-text) !important;
    }
    .join-avg {
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--bg-surface);
      border: 1px solid var(--color-success-border);
      color: var(--color-success-text) !important;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
    }

    /* Cap Reached Banner */
    .cap-reached-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning-border);
      border-radius: var(--radius-md);
    }
    .cap-banner-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }
    .cap-icon { display: inline-flex; color: var(--color-warning-text); flex-shrink: 0; }
    .cap-banner-text strong { display: block; font-size: 0.8125rem; font-weight: 500; color: var(--color-warning-text) !important; }
    .cap-count { font-size: 0.75rem; color: var(--color-warning-text) !important; opacity: 0.85; }
    .cap-extend-btn { white-space: nowrap; flex-shrink: 0; }
    .ext-count {
      font-size: 0.7rem;
      background: rgba(255,255,255,0.2);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      margin-left: 0.3rem;
    }
    .cap-final-badge {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-danger-text) !important;
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
      padding: 1.5rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
    }
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1.25rem;
      h3 { font-size: 1.125rem; font-weight: 500; color: var(--text-primary) !important; margin: 0; letter-spacing: -0.015em; }
      .section-subtitle { font-size: 0.8125rem; color: var(--text-muted) !important; margin-top: 0.25rem; font-weight: 400; }
    }
    .link-action {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-primary-600) !important;
      text-decoration: none !important;
      transition: color 150ms var(--ease-out);
      white-space: nowrap;
      &:hover {
        text-decoration: none !important;
        color: var(--color-primary-700) !important;
      }
    }

    .empty-state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      background: var(--bg-app);
      border: 1px dashed var(--border-hairline);
      border-radius: var(--radius-lg);
      margin-top: 0.75rem;
    }
    .empty-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--color-primary-50);
      color: var(--color-primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      svg { width: 22px; height: 22px; stroke-width: 1.5; }
    }
    .empty-state-box h4 {
      font-size: 1.05rem;
      font-weight: 500;
      color: var(--text-primary) !important;
      margin: 0 0 0.4rem 0;
    }
    .empty-state-box p {
      font-size: 0.875rem;
      color: var(--text-muted) !important;
      max-width: 400px;
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }

    /* Table */
    .quiz-table-wrapper { overflow-x: auto; }
    .quiz-row-item { display: flex; align-items: center; gap: 0.75rem; }
    .q-icon-circle {
      width: 30px;
      height: 30px;
      border-radius: 6px;
      background: var(--bg-muted);
      border: 1px solid var(--border-hairline);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .q-info { display: flex; flex-direction: column; .q-name { font-weight: 500; color: var(--text-primary) !important; } .q-time { font-size: 0.75rem; color: var(--text-muted) !important; font-weight: 400; } }
    .text-dark { color: var(--text-primary) !important; }
    .action-btns-row { display: flex; gap: 0.4rem; align-items: center; }

    .score-pill { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 0.8rem; font-weight: 500; padding: 0.15rem 0.5rem; border-radius: 6px; }
    .score-high { background: var(--color-success-bg); color: var(--color-success-text) !important; border: 1px solid var(--color-success-border); }
    .score-medium { background: var(--color-warning-bg); color: var(--color-warning-text) !important; border: 1px solid var(--color-warning-border); }

    /* Cheating row highlight */
    .cheat-row td { background: rgba(239, 68, 68, 0.04) !important; }
    .cheat-row { outline: 1px solid rgba(239, 68, 68, 0.2); }
    .cheat-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      background: var(--color-danger-bg);
      color: var(--color-danger) !important;
      border: 1px solid var(--color-danger-border);
      margin-left: 0.4rem;
      vertical-align: middle;
    }

    /* Admin Leaderboard Modal */
    .modal-lg { max-width: 820px !important; }
    .modal-eyebrow {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-primary-600);
    }
    .modal-header-title {
      h3 { font-size: 1.25rem; font-weight: 500; color: var(--text-primary) !important; margin: 0; }
    }
    .leaderboard-modal-body {
      max-height: 65vh;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 0.5rem;
    }
    .leaderboard-meta-banner {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.85rem;
      padding: 1rem;
      background: var(--bg-app);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      .meta-item { display: flex; flex-direction: column; align-items: center; text-align: center; }
      .meta-label { font-size: 0.75rem; font-weight: 500; color: var(--text-muted) !important; }
      .meta-val { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 1.05rem; font-weight: 500; margin-top: 0.2rem; }
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-variant-numeric: tabular-nums;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--bg-muted);
      color: var(--text-secondary);
      border: 1px solid var(--border-hairline);
    }
    .rank-1 { background: var(--color-primary-50); color: var(--color-primary-700) !important; border-color: var(--color-primary-200); }
    .rank-2 { background: var(--bg-muted); color: var(--text-primary) !important; border-color: var(--border-strong); }
    .rank-3 { background: var(--bg-app); color: var(--text-secondary) !important; border-color: var(--border-hairline); }
    .score-num-text { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 0.95rem; font-weight: 500; color: var(--color-primary-600) !important; }
    .modal-footer-row { display: flex; justify-content: flex-end; gap: 0.5rem; }

    /* Modal Backdrop & Report Dialog */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-content {
      width: 100%;
      max-width: 480px;
      border-radius: var(--radius-xl);
      padding: 1.5rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      h3 { font-size: 1.125rem; font-weight: 500; margin: 0; }
      .close-btn { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: var(--text-muted); padding: 0.25rem; }
    }
    .report-modal-body {
      h2 { font-size: 1.25rem; font-weight: 500; margin: 0.5rem 0 0.2rem 0; color: var(--text-primary) !important; }
    }
    .report-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
      .stat-label { font-size: 0.75rem; font-weight: 500; color: var(--text-muted) !important; }
      .stat-num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 1.25rem; font-weight: 500; }
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


    @media (max-width: 900px) {
      .dashboard-layout { padding: 1.25rem 1rem 3rem 1rem; }
      .metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
      .dashboard-hero {
        flex-direction: column;
        align-items: flex-start;
        padding: 1.5rem;
        gap: 1.25rem;
      }
      .hero-content h1 { font-size: 1.55rem; }
      .hero-actions { width: 100%; }
      .hero-btn { flex: 1; justify-content: center; text-align: center; }
      .running-quiz-empty-banner { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .ongoing-attempt-alert { flex-direction: column; align-items: flex-start; }
      .ongoing-right-box { align-items: flex-start; width: 100%; }
      .ongoing-btn-row { flex-direction: column; gap: 0.5rem; width: 100%; }
      .ongoing-btn-row .btn { width: 100%; justify-content: center; }
      .scorecard-summary-grid { grid-template-columns: 1fr; }
      .section-title-row { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
      .link-action { align-self: flex-start; }
      .running-quizzes-grid { grid-template-columns: 1fr 1fr; gap: 0.875rem; }
    }

    @media (max-width: 640px) {
      .dashboard-layout { padding: 1rem 0.75rem 2.5rem 0.75rem; }
      .dashboard-hero { padding: 1.25rem; gap: 1rem; border-radius: var(--radius-lg); }
      .hero-content h1 { font-size: 1.4rem; line-height: 1.3; }
      .hero-desc { font-size: 0.875rem !important; }
      .hero-actions { flex-direction: column; }
      .hero-btn { width: 100%; }

      .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 0.75rem !important; }
      .stat-card { min-width: 0 !important; padding: 0.9rem !important; }
      .stat-card-top { min-width: 0; margin-bottom: 0.35rem !important; }
      .stat-value { font-size: 1.5rem !important; line-height: 1.1 !important; margin-bottom: 0.2rem !important; }
      .stat-subtext { margin-top: 0.2rem !important; font-size: 0.72rem !important; line-height: 1.25 !important; }
      .stat-title { min-width: 0; font-size: 0.75rem !important; overflow-wrap: anywhere; }

      .suggestion-toolbar, .govt-dashboard-hub { padding: 1.1rem; border-radius: var(--radius-lg); }
      .topic-pills-row, .govt-stream-pills-row {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        gap: 0.5rem;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .topic-pills-row::-webkit-scrollbar, .govt-stream-pills-row::-webkit-scrollbar { display: none; }
      .topic-pill, .stream-pill { flex-shrink: 0; padding: 0.45rem 0.85rem; }

      .running-quizzes-grid { grid-template-columns: 1fr; gap: 0.875rem; }
      .quiz-table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: var(--radius-md); border: 1px solid var(--border-hairline); }
      .qp-table { min-width: 680px; }

      .content-card { padding: 1.15rem; border-radius: var(--radius-lg); margin-bottom: 1.25rem; }
      .running-quiz-item-card { padding: 1.15rem !important; }

      .rq-actions-row { flex-direction: column; gap: 0.5rem; width: 100%; }
      .rq-actions-row .btn, .rq-actions-row a { width: 100%; justify-content: center; text-align: center; }

      .action-btns-row { flex-wrap: wrap; gap: 0.35rem; }
      .modal-content { padding: 1.25rem 1rem !important; max-width: 96% !important; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly UserRole = UserRole;
  readonly authService = inject(AuthService);
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  readonly summary = signal<UserQuizDashboardSummary | null>(null);
  readonly isLoading = signal(true);
  readonly showToast = signal(false);
  readonly showGovernmentExamStreams = signal(false);
  readonly shareCopyFailed = signal(false);
  readonly selectedReportAttempt = signal<UserAttemptItem | null>(null);
  readonly ongoingAttempt = signal<any | null>(null);
  readonly ongoingTimerText = signal<string>('');

  readonly selectedLeaderboardQuiz = signal<UserQuizItem | null>(null);
  readonly leaderboardItems = signal<QuizLeaderboardItem[]>([]);
  readonly isLeaderboardLoading = signal(false);

  readonly showScorecardModal = signal(false);
  readonly isScorecardLoading = signal(false);
  readonly selectedAttemptDetails = signal<AdminAttemptDetails | null>(null);
  readonly formatDuration = formatDurationSeconds;

  private ongoingInterval: any = null;

  ngOnInit(): void {
    this.fetchDashboardSummary();
    this.checkOngoingAttempt();
  }

  toggleGovernmentExamStreams(): void {
    this.showGovernmentExamStreams.update(isOpen => !isOpen);
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
    return this.isStudent() ? list : list.filter(q => q.isPublished);
  }

  isStudent(): boolean {
    return this.authService.userRole() === UserRole.Student;
  }

  canCreateQuizzes(): boolean {
    const role = this.authService.userRole();
    return role === UserRole.Student || role === UserRole.Instructor || role === UserRole.TenantAdmin || role === UserRole.SuperAdmin;
  }

  canManageQuizzes(): boolean {
    const role = this.authService.userRole();
    return role === UserRole.Instructor || role === UserRole.TenantAdmin || role === UserRole.SuperAdmin;
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

  getLeaderboardPassedCount(): number {
    return this.leaderboardItems().filter(item => item.isPassed && !item.isDisqualified).length;
  }

  getStudentBestScore(): number {
    const items = this.leaderboardItems();
    if (items.length === 0) return 0;
    return Math.max(...items.map(i => i.scorePercentage));
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

  editQuiz(quizId: string): void {
    this.router.navigate(['/quiz', quizId, 'edit']);
  }

  async copyShareLink(shortId: string): Promise<void> {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const defaultOrigin = `${protocol}//${host}${port}`;
    const env = (window as any).__env__ || null;
    const devOverride = env?.devHostOverride || null;
    const origin = (host === 'localhost' || host === '127.0.0.1') && devOverride ? devOverride : defaultOrigin;
    const url = `${origin}/q/${shortId}`;
    const copied = await copyTextToClipboard(url);
    this.shareCopyFailed.set(!copied);
    this.showToast.set(copied);
    setTimeout(() => {
      this.showToast.set(false);
      this.shareCopyFailed.set(false);
    }, 3000);
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
        alert(res.message);
      },
      error: (err) => {
        alert(`Failed to extend limit: ${err.error?.message || 'Unknown error'}`);
      }
    });
  }
}


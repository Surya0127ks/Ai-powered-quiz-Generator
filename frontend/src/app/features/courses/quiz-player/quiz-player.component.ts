import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { AuthService } from '../../../core/services/auth.service';
import { QuestionType, Quiz, QuizAttemptResult, StudentAnswerItem } from '../../../core/models/quiz.model';

@Component({
  selector: 'app-quiz-player',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="quiz-container">
      <header class="quiz-header">
        @if (!isPublicMode) {
          <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        }
      </header>

      <!-- Toast Notification -->
      @if (showToast()) {
        <div class="toast-notification">
          ✨ Shareable Quiz Link copied to clipboard!
        </div>
      }

      <!-- Focus Loss Warning Toast -->
      @if (showFocusWarning()) {
        <div class="toast-notification warning-toast">
          ⚠️ Warning {{ cheatWarningCount }}/2: Leaving the assessment window is not allowed! One more violation will auto-submit your exam.
        </div>
      }

      <!-- Cheating / Disqualified Overlay -->
      @if (isDisqualified()) {
        <div class="disqualified-overlay">
          <div class="disqualified-card">
            <div class="dq-icon">🚫</div>
            <h2>Assessment Terminated</h2>
            <p>You were <strong>disqualified</strong> for switching browser tabs or leaving the exam window. Your attempt has been automatically submitted and flagged for the instructor.</p>
            <div class="dq-details">
              <span>📋 Violations: {{ cheatWarningCount }}</span>
              <span>⏱️ Remaining time was forfeited</span>
            </div>
            @if (!isPublicMode) {
              <a routerLink="/dashboard" class="btn btn-outline" style="margin-top: 1.5rem;">Return to Dashboard</a>
            } @else {
              <p style="margin-top: 1.5rem; color: var(--text-muted);">This window can now be closed.</p>
            }
          </div>
        </div>
      }

      <!-- QR Code Modal Dialog -->
      @if (showQrModal()) {
        <div class="modal-backdrop" (click)="toggleQrModal()">
          <div class="modal-content saas-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>📱 Share Quiz via QR Code</h3>
              <button (click)="toggleQrModal()" class="close-btn">✕</button>
            </div>
            <div class="qr-body">
              <div class="qr-frame">
                <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeUrl(getShareableUrl())" alt="Quiz QR Code" />
              </div>
              <p class="qr-desc">Scan with mobile camera to launch assessment directly.</p>
              <input type="text" readonly [value]="getShareableUrl()" class="input-control share-url-input" />
              <button (click)="copyShareLink()" class="btn btn-primary btn-sm margin-top">Copy Link</button>
            </div>
          </div>
        </div>
      }

      <!-- Missing Details Modal for Public Mode -->
      @if (showMissingDetailsModal()) {
        <div class="modal-backdrop">
          <div class="modal-content saas-card">
            <div class="modal-header">
              <h3>📝 Student Details Required</h3>
              <button (click)="showMissingDetailsModal.set(false)" class="close-btn">✕</button>
            </div>
            <div class="modal-body" style="padding: 1.5rem;">
              <p style="margin-top: 0; margin-bottom: 1.25rem; color: var(--text-secondary); font-size: 0.95rem;">
                You forgot to fill in your student details! Please provide your name and email to submit your assessment and claim your certificate.
              </p>
              <div class="form-grid-2">
                <input type="text" [(ngModel)]="studentDetails.studentName" placeholder="Full Name *" class="input-control mb-2" />
                <input type="text" [(ngModel)]="studentDetails.email" placeholder="Email Address *" class="input-control mb-2" />
                <input type="text" [(ngModel)]="studentDetails.rollNumber" placeholder="Roll Number / ID" class="input-control mb-2" />
                <input type="text" [(ngModel)]="studentDetails.phoneNumber" placeholder="Phone Number" class="input-control mb-2" />
                <input type="text" [(ngModel)]="studentDetails.className" placeholder="Class / Grade" class="input-control mb-2" />
                <input type="text" [(ngModel)]="studentDetails.department" placeholder="Department / Subject" class="input-control mb-2" />
              </div>
              <button (click)="submitQuizWithDetails()" class="btn btn-ai width-full mt-3" style="margin-top: 1.5rem;">
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      }

      @if (isLoading()) {
        <div class="loading-state saas-card">
          <div class="spinner"></div>
          <span>Loading assessment details...</span>
          @if (isSlowLoad()) {
            <p class="slow-load-hint">⏳ Server is waking up, this may take up to 30 seconds...</p>
          }
        </div>
      } @else if (isError()) {
        <!-- Error / Retry State -->
        <div class="error-card saas-card">
          <div class="error-icon">⚠️</div>
          <h2 class="error-title">Could not load the quiz</h2>
          <p class="error-desc">
            The server may be starting up (this happens after a period of inactivity on free hosting).
            Please wait a moment and try again.
          </p>
          @if (retryCountdown() > 0) {
            <div class="retry-countdown">
              <div class="countdown-ring">
                <span class="countdown-num">{{ retryCountdown() }}</span>
              </div>
              <p class="retry-auto-label">Auto-retrying in {{ retryCountdown() }}s...</p>
            </div>
          } @else {
            <button (click)="retryLoad()" class="btn btn-ai retry-btn">
              🔄 Retry Now
            </button>
          }
          <p class="error-attempts">Attempt {{ retryAttempt() }} of 4</p>
        </div>
      } @else if (result()) {
        <!-- Score Result View (Clean Mode) -->
        <div class="result-card saas-card" style="text-align: center; padding: 4rem 2rem;">
          <div class="result-badge" [class.passed]="true" style="background: none; border: none;">
            <span class="badge-icon" style="font-size: 4rem; display: block; margin-bottom: 1rem;">✅</span>
            <h2 style="font-size: 2rem; color: var(--color-success);">Assessment Submitted Successfully</h2>
            <p class="score-summary" style="font-size: 1.1rem; color: var(--text-secondary); max-width: 600px; margin: 1rem auto;">
              Thank you for completing the assessment. Your responses have been securely recorded.
            </p>
          </div>

          <!-- Certificate Banner -->
          @if (result()?.isPassed && quiz()?.enableCertificate) {
            @if (quiz()?.certificateForTopperOnly && !result()?.certificateNumber) {
              <div class="cert-award-banner margin-top mb-3" style="background: #FFFBEB; border-color: #FBBF24;">
                <div class="cert-award-info">
                  <h3 style="color: #D97706;">🏆 High Score Recorded!</h3>
                  <p>Congratulations on passing <strong>{{ quiz()?.title }}</strong> with a score of <strong>{{ result()?.scorePercentage }}%</strong>.</p>
                  <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-muted) !important;">
                    This quiz issues certificates only to the top scorer. If you maintain the highest score when the quiz closes, your certificate will be generated and available in your history.
                  </p>
                </div>
              </div>
            } @else {
              <div class="cert-award-banner margin-top mb-3">
                <div class="cert-award-info">
                  <h3>🎓 Official Certificate Unlocked!</h3>
                  <p>Congratulations! You passed <strong>{{ quiz()?.title }}</strong> with a score of <strong>{{ result()?.scorePercentage }}%</strong>.</p>
                  @if (result()?.certificateNumber) {
                    <p>Certificate ID: <strong>{{ result()?.certificateNumber }}</strong></p>
                  }
                </div>
                @if (isPublicMode && result()?.certificateNumber) {
                  <a
                    [href]="'/api/v1/public/certificates/' + result()?.certificateNumber + '/pdf'"
                    target="_blank"
                    class="btn btn-ai"
                  >
                    📥 Download PDF Certificate
                  </a>
                } @else {
                  <a
                    [routerLink]="['/certificate/generator']"
                    [queryParams]="{ student: studentDetails.studentName || (authService.currentUser()?.firstName || 'Student') + ' ' + (authService.currentUser()?.lastName || ''), title: quiz()?.title, score: result()?.scorePercentage }"
                    class="btn btn-ai"
                  >
                    📜 Generate & Issue Official Certificate
                  </a>
                }
              </div>
            }
          }

          <div class="result-actions margin-top">
            @if (!isPublicMode) {
              <button (click)="retakeQuiz()" class="btn btn-outline">Retake Quiz</button>
              <a routerLink="/student/progress" class="btn btn-outline">View History</a>
              <a routerLink="/dashboard" class="btn btn-primary">Return to Dashboard →</a>
            } @else {
              <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0 0 1rem;">Your response has been recorded. You may now close this window.</p>
              <a href="/" class="btn btn-primary">Go to Homepage →</a>
            }
          </div>
        </div>
      } @else if (quiz() && !isStarted()) {
        <!-- Pre-Quiz Overview & Instructions Landing Card -->
        <div class="overview-card saas-card">
          <div class="overview-header text-left">
            <div class="badge-row mb-2">
              <span class="badge badge-ai">📝 {{ quiz()?.category || 'General Assessment' }}</span>
              <span class="badge badge-slate">⚡ {{ quiz()?.difficulty || 'Intermediate' }}</span>
              <span class="badge badge-primary">⏱️ {{ quiz()?.timeLimitMinutes ? quiz()?.timeLimitMinutes + ' Mins' : '15 Mins' }}</span>
            </div>
            <h1 class="overview-title">{{ quiz()?.title }}</h1>
            <p class="overview-desc">{{ quiz()?.description || 'Test your knowledge with this interactive assessment. Complete all questions to earn your score and verified certificate.' }}</p>
          </div>

          <!-- Share & QR Quick Actions Bar -->
          @if (quiz()?.createdByUserId && authService.currentUser()?.id === quiz()?.createdByUserId) {
            <div class="share-banner margin-top">
              <div class="share-info">
                <span class="share-label">🔗 Share Assessment Link:</span>
                <input type="text" readonly [value]="getShareableUrl()" class="share-url-box" />
              </div>
              <div class="share-btns">
                <button (click)="copyShareLink()" class="btn btn-outline btn-sm">
                  📋 Copy Link
                </button>
                <button (click)="toggleQrModal()" class="btn btn-outline btn-sm">
                  📱 Show QR
                </button>
              </div>
            </div>
          }

          <!-- 3-Column Assessment Metrics Grid -->
          <div class="specs-grid margin-top">
            <div class="spec-box">
              <div class="spec-icon">📋</div>
              <div class="spec-details">
                <span class="spec-label">Total Questions</span>
                <span class="spec-val">{{ quiz()?.questions?.length || 10 }} Items</span>
              </div>
            </div>
            <div class="spec-box">
              <div class="spec-icon">⏱️</div>
              <div class="spec-details">
                <span class="spec-label">Time Duration</span>
                <span class="spec-val">{{ quiz()?.timeLimitMinutes ? quiz()?.timeLimitMinutes + ' Minutes' : '15 Minutes' }}</span>
              </div>
            </div>
            <div class="spec-box">
              <div class="spec-icon">🎯</div>
              <div class="spec-details">
                <span class="spec-label">Passing Target</span>
                <span class="spec-val">{{ quiz()?.passingScorePercentage || 70 }}% Score</span>
              </div>
            </div>
          </div>

          <!-- Guidelines Box -->
          <div class="instructions-box margin-top">
            @if (quiz()?.welcomeMessage) {
              <h4 class="mb-2">👋 {{ quiz()?.welcomeMessage }}</h4>
            }
            <h4>💡 Assessment Rules & Guidelines</h4>
            <div class="instructions-list mt-2">
              @if (quiz()?.instructions) {
                <p style="white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6;">{{ quiz()?.instructions }}</p>
              } @else {
                <ul>
                  <li>Read each question item carefully before making your selection.</li>
                  <li>You can navigate back and forth between questions using the question tab bar.</li>
                  <li>Once submitted, your score and detailed answer explanations will be calculated live.</li>
                  <li>An official verified certificate is issued upon achieving a passing score.</li>
                </ul>
              }
            </div>
          </div>

          <!-- Student Identification Registration Box -->
          @if (isPublicMode) {
            <div class="student-id-box margin-top">
              <label class="student-id-label">👤 Student Details (Required for Official Certificate & Leaderboard):</label>
              <div class="form-grid-2 margin-top-xs">
                <input type="text" [(ngModel)]="studentDetails.studentName" placeholder="Full Name *" class="input-control mb-2" />
                <div class="email-field-wrap">
                  <input
                    type="email"
                    [(ngModel)]="studentDetails.email"
                    placeholder="Email Address *"
                    class="input-control"
                    [class.input-error]="emailAlreadyUsed()"
                    (input)="onEmailChange()"
                  />
                  @if (emailAlreadyUsed()) {
                    <div class="email-error-msg">
                      🚫 This email has already been used for this quiz. Please use a different email.
                    </div>
                  }
                </div>
                <input type="text" [(ngModel)]="studentDetails.rollNumber" placeholder="Roll Number / ID" class="input-control mb-2" />
                <input type="text" [(ngModel)]="studentDetails.phoneNumber" placeholder="Phone Number" class="input-control mb-2" />
                <input type="text" [(ngModel)]="studentDetails.className" placeholder="Class / Grade" class="input-control mb-2" />
                <input type="text" [(ngModel)]="studentDetails.department" placeholder="Department / Subject" class="input-control mb-2" />
              </div>
            </div>
          }

          <!-- Start Action Button -->
          <div class="start-action-row margin-top">
            @if (!isPublicMode && quiz()?.createdByUserId && authService.currentUser()?.id === quiz()?.createdByUserId) {
              <div class="creator-preview-alert mb-3" style="text-align: center; color: var(--text-secondary); font-weight: 500;">
                <p>You are the creator of this assessment.</p>
              </div>
              <button [routerLink]="['/quiz', quiz()?.id, 'edit']" class="btn btn-outline btn-lg width-full">
                ✏️ Edit Assessment / View Answers
              </button>
            } @else {
              <button
                (click)="startQuiz()"
                class="btn btn-ai btn-lg width-full start-btn"
                [disabled]="emailAlreadyUsed()"
                [class.btn-disabled]="emailAlreadyUsed()"
              >
                🚀 Start Assessment Now
              </button>
            }
          </div>
        </div>
      } @else if (quiz() && isStarted()) {
        <!-- Interactive Quiz Taking Form -->
        <div class="quiz-card saas-card">
          <!-- Quiz Top Progress Bar, Timer & Header -->
          <div class="quiz-progress-header">
            <div class="quiz-title-badge-row">
              <span class="badge badge-ai">📝 {{ quiz()?.category || 'General Assessment' }}</span>
              <div class="header-right-meta">
                <span class="timer-pill" [class.warning]="remainingSeconds() < 120">
                  ⏱️ {{ getFormattedTime() }} remaining
                </span>
                <span class="progress-step-text">
                  Question <strong>{{ currentQuestionIndex() + 1 }}</strong> of <strong>{{ quiz()?.questions?.length || 10 }}</strong>
                </span>
              </div>
            </div>
            <div class="progress-track-bar">
              <div class="progress-fill-bar" [style.width.%]="((currentQuestionIndex() + 1) / (quiz()?.questions?.length || 10)) * 100"></div>
            </div>
          </div>

          <!-- Question Tabs Navigation -->
          <div class="questions-navigation">
            @for (ques of quiz()?.questions; track ques.id; let idx = $index) {
              <button
                [class.active]="currentQuestionIndex() === idx"
                [class.answered]="isQuestionAnswered(ques.id)"
                (click)="setQuestionIndex(idx)"
                class="q-nav-tab"
              >
                {{ idx + 1 }}
              </button>
            }
          </div>

          @if (currentQuestion()) {
            <div class="question-body">
              <div class="q-meta">
                <span class="badge badge-primary">
                  {{ currentQuestion()?.type === QuestionType.MultipleChoice ? 'Multiple Choice' : 'Single Choice' }}
                </span>
                <span class="q-points">{{ currentQuestion()?.points }} {{ currentQuestion()?.points === 1 ? 'Point' : 'Points' }}</span>
              </div>

              <h3 class="question-title">{{ currentQuestion()?.questionText }}</h3>

              <!-- Options Selection -->
              <div class="options-list">
                @for (opt of currentQuestion()?.options; track opt.id) {
                  <label
                    class="option-item"
                    [class.selected]="isOptionSelected(currentQuestion()!.id, opt.id)"
                  >
                    <input
                      [type]="currentQuestion()?.type === QuestionType.MultipleChoice ? 'checkbox' : 'radio'"
                      [name]="'q_' + currentQuestion()!.id"
                      [checked]="isOptionSelected(currentQuestion()!.id, opt.id)"
                      (change)="selectOption(currentQuestion()!.id, opt.id, currentQuestion()!.type)"
                    />
                    <span class="opt-text">{{ opt.optionText }}</span>
                  </label>
                }
              </div>

              <div class="quiz-footer">
                <button
                  [disabled]="currentQuestionIndex() === 0"
                  (click)="prevQuestion()"
                  class="btn btn-outline"
                >
                  ← Previous
                </button>

                @if (currentQuestionIndex() < (quiz()?.questions?.length || 1) - 1) {
                  <button (click)="nextQuestion()" class="btn btn-primary">Next Question →</button>
                } @else {
                  <button (click)="submitQuiz()" class="btn btn-primary">Submit Quiz Assessment</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .quiz-container {
      padding: 1.75rem 1.25rem;
      max-width: 860px;
      margin: 0 auto;
      text-align: left;
    }
    .quiz-header { margin-bottom: 1.25rem; }
    .back-link { color: var(--color-primary-600) !important; text-decoration: none; font-size: 0.875rem; font-weight: 700; display: inline-block; &:hover { text-decoration: underline; } }
    .badge-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 1.0rem; }

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
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    }

    /* Pre-Quiz Overview Screen */
    .overview-card { padding: 2.25rem; text-align: left; }
    .overview-title { font-size: 2.1rem; font-weight: 800; color: var(--text-primary) !important; margin: 0.5rem 0 0.35rem 0; line-height: 1.25; }
    .overview-desc { font-size: 0.975rem; color: var(--text-secondary) !important; line-height: 1.5; margin: 0; }

    .share-banner {
      background: var(--bg-app);
      border: 1px solid var(--border-hairline);
      border-radius: 0.65rem;
      padding: 0.85rem 1.15rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.0rem;
    }
    .share-info { display: flex; align-items: center; gap: 0.6rem; flex-grow: 1; }
    .share-label { font-size: 0.825rem; font-weight: 700; color: var(--text-primary) !important; white-space: nowrap; }
    .share-url-box { font-size: 0.825rem !important; background: #ffffff !important; font-family: monospace; padding: 6px 10px; border-radius: 4px; border: 1px solid var(--border-hairline); }
    .share-btns { display: flex; gap: 0.4rem; flex-shrink: 0; }

    .specs-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.0rem;
    }
    .spec-box {
      background: #ffffff;
      border: 1px solid var(--border-hairline);
      border-radius: 0.65rem;
      padding: 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .spec-icon { font-size: 1.6rem; }
    .spec-details { display: flex; flex-direction: column; }
    .spec-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted) !important; text-transform: uppercase; }
    .spec-val { font-size: 1.05rem; font-weight: 800; color: var(--text-primary) !important; }

    .instructions-box {
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      border-radius: 0.65rem;
      padding: 1.25rem 1.5rem;
      h4 { font-size: 1.0rem; font-weight: 800; color: var(--color-primary-600) !important; margin: 0 0 0.6rem 0; }
    }
    .instructions-list {
      margin: 0;
      padding-left: 1.2rem;
      font-size: 0.9rem;
      color: var(--text-secondary) !important;
      line-height: 1.6;
      li { margin-bottom: 0.25rem; }
    }

    .start-btn {
      padding: 0.95rem 1.5rem !important;
      font-size: 1.05rem !important;
      font-weight: 800 !important;
      border-radius: 0.65rem !important;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      z-index: 1200;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-content { width: 100%; max-width: 400px; padding: 1.75rem; text-align: center; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; h3 { font-size: 1.1rem; margin: 0; } }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
    .qr-frame { width: 190px; height: 190px; margin: 0 auto 1rem auto; padding: 0.5rem; background: #ffffff; border: 1.5px solid var(--border-hairline); border-radius: 0.75rem; img { width: 100%; height: 100%; } }
    .qr-desc { font-size: 0.825rem; color: var(--text-secondary) !important; margin-bottom: 1rem; }
    .share-url-input { font-size: 0.8rem !important; text-align: center; }

    /* Interactive Quiz Form */
    .quiz-card { padding: 2.0rem; text-align: left; }
    
    .quiz-progress-header {
      margin-bottom: 1.25rem;
    }
    .quiz-title-badge-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
    }
    .header-right-meta {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .timer-pill {
      font-size: 0.825rem;
      font-weight: 800;
      color: var(--color-primary-600);
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      &.warning {
        color: var(--color-danger);
        background: var(--color-danger-bg);
        border-color: var(--color-danger-border);
        animation: pulse 1s infinite alternate;
      }
    }
    @keyframes pulse {
      0% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    .progress-step-text {
      font-size: 0.85rem;
      color: var(--text-secondary) !important;
    }
    .progress-track-bar {
      width: 100%;
      height: 6px;
      background: var(--color-primary-50);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-fill-bar {
      height: 100%;
      background: var(--color-primary-600);
      border-radius: 9999px;
      transition: width 0.25s ease;
    }

    .questions-navigation { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.75rem; border-bottom: 1px solid var(--border-hairline); padding-bottom: 1rem; }
    .q-nav-tab { width: 38px; height: 38px; border-radius: 0.5rem; background: var(--bg-app); border: 1px solid var(--border-hairline); color: var(--text-secondary); font-weight: 800; cursor: pointer; transition: all 0.15s ease; }
    .toast-notification { position: fixed; top: 1.5rem; right: 1.5rem; background: var(--bg-card); color: var(--text-primary); padding: 1rem 1.5rem; border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-weight: 500; border-left: 4px solid var(--accent-primary); z-index: 1000; animation: slideIn 0.3s ease-out; }
    .warning-toast { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.1); color: #ef4444; backdrop-filter: blur(8px); }
    .q-nav-tab.active { background: var(--color-primary-600) !important; color: #ffffff !important; border-color: var(--color-primary-600) !important; }
    .q-nav-tab.answered:not(.active) { border-color: var(--color-success-border); color: var(--color-success) !important; background: var(--color-success-bg); }

    .question-body { text-align: left; }
    .q-meta { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; }
    .q-points { color: var(--text-muted) !important; font-size: 0.8rem; font-weight: 700; }
    .question-title { font-size: 1.25rem; font-weight: 800; color: var(--text-primary) !important; margin: 0 0 1.5rem 0; line-height: 1.4; text-align: left; }
    
    .options-list { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 2rem; }
    .option-item {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 1.0rem;
      padding: 1.1rem 1.35rem;
      border-radius: 0.75rem;
      background: #ffffff;
      border: 1.5px solid var(--border-hairline);
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
      width: 100%;
      &:hover {
        border-color: var(--color-primary-200);
        background: var(--color-primary-50);
      }
    }
    .option-item input[type="radio"],
    .option-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--color-primary-600);
      flex-shrink: 0;
      cursor: pointer;
      margin: 0;
    }
    .option-item.selected {
      background: var(--color-primary-50) !important;
      border-color: var(--color-primary-600) !important;
      border-width: 2px;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
    }
    .opt-text {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary) !important;
      text-align: left !important;
      line-height: 1.4;
      flex-grow: 1;
    }
    .quiz-footer { display: flex; justify-content: space-between; align-items: center; }

    /* Results Card */
    .result-card { text-align: center; padding: 2.25rem; }
    .result-badge { padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; background: var(--color-danger-bg); border: 1px solid var(--color-danger-border); }
    .result-badge.passed { background: var(--color-success-bg); border-color: var(--color-success-border); }
    .badge-icon { font-size: 3rem; }
    .score-display { margin: 1rem 0; }
    .score-num { font-size: 3.25rem; font-weight: 800; color: var(--color-primary-600); display: block; }
    .score-sub { font-size: 0.85rem; color: var(--text-muted) !important; font-weight: 700; }
    .score-summary { color: var(--text-secondary) !important; font-size: 0.95rem; margin-top: 0.5rem; }

    .cert-award-banner {
      background: var(--color-ai-bg);
      border: 1px solid var(--color-ai-border);
      border-radius: 0.75rem;
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.0rem;
      text-align: left;
      h3 { font-size: 1.1rem; font-weight: 800; color: var(--color-ai-purple) !important; margin: 0 0 0.25rem 0; }
      p { font-size: 0.875rem; color: var(--text-secondary) !important; margin: 0; }
    }

    .reviews-list { text-align: left; margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem; h3 { font-size: 1.15rem; font-weight: 800; color: var(--text-primary) !important; margin-bottom: 0.5rem; } }
    .review-item { padding: 1rem 1.25rem; border-radius: 0.75rem; background: #ffffff; border: 1px solid var(--border-hairline); border-left: 5px solid var(--text-muted); }
    .review-item.correct { border-left-color: var(--color-success); background: var(--color-success-bg); }
    .review-item.incorrect { border-left-color: var(--color-danger); background: var(--color-danger-bg); }
    .review-header { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 800; color: var(--text-muted) !important; margin-bottom: 0.35rem; }
    .q-text { color: var(--text-primary) !important; font-weight: 700; }
    .explanation-box { margin-top: 0.5rem; padding: 0.65rem 0.85rem; background: #ffffff; border: 1px solid var(--border-hairline); border-radius: 0.375rem; font-size: 0.85rem; color: var(--text-secondary) !important; }

    .result-actions { display: flex; justify-content: center; gap: 1rem; margin-top: 2rem; }
    .margin-top { margin-top: 1.75rem; }
    .margin-top-xs { margin-top: 0.5rem; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .loading-state { padding: 4rem 2rem; text-align: center; color: var(--text-muted) !important; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .slow-load-hint { font-size: 0.825rem; color: var(--text-muted) !important; font-weight: 500; margin: 0; animation: fadein 0.5s ease; }

    /* Error / Retry Card */
    .error-card { padding: 3.5rem 2rem; text-align: center; }
    .error-icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .error-title { font-size: 1.6rem; font-weight: 800; color: var(--text-primary) !important; margin: 0 0 0.75rem; }
    .error-desc { font-size: 0.9rem; color: var(--text-secondary) !important; line-height: 1.6; max-width: 460px; margin: 0 auto 2rem; }
    .retry-btn { min-width: 160px; padding: 0.85rem 2rem !important; font-size: 1rem !important; }
    .error-attempts { font-size: 0.78rem; color: var(--text-muted) !important; margin-top: 1.25rem; font-weight: 600; }
    .retry-countdown { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .countdown-ring {
      width: 72px; height: 72px; border-radius: 50%;
      background: conic-gradient(var(--color-primary-600) 0%, var(--color-primary-50) 0%);
      display: flex; align-items: center; justify-content: center;
      border: 3px solid var(--color-primary-200);
      animation: ringPulse 1s ease-in-out infinite alternate;
    }
    .countdown-num { font-size: 1.6rem; font-weight: 800; color: var(--color-primary-600); }
    .retry-auto-label { font-size: 0.85rem; color: var(--text-secondary) !important; font-weight: 600; margin: 0; }
    @keyframes ringPulse { from { box-shadow: 0 0 0 0 rgba(79,70,229,0.15); } to { box-shadow: 0 0 0 10px rgba(79,70,229,0); } }
    @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }

    /* Email duplicate error */
    .email-field-wrap { display: flex; flex-direction: column; gap: 0.35rem; }
    .input-error { border-color: var(--color-danger) !important; background: var(--color-danger-bg) !important; }
    .email-error-msg { font-size: 0.8rem; font-weight: 600; color: var(--color-danger); display: flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.6rem; background: var(--color-danger-bg); border: 1px solid var(--color-danger-border); border-radius: 0.4rem; animation: fadein 0.2s ease; }
    .btn-disabled { opacity: 0.5; cursor: not-allowed !important; pointer-events: none; }
    .width-full { width: 100%; }

    @media (max-width: 768px) {
      .specs-grid { grid-template-columns: 1fr 1fr; }
      .share-banner { flex-direction: column; align-items: flex-start; }
      .cert-award-banner { flex-direction: column; align-items: flex-start; }
      .header-right-meta { flex-direction: column; align-items: flex-end; gap: 0.35rem; }
    }
    
    @media (max-width: 600px) {
      .quiz-container { padding: 1rem 0.875rem 2rem 0.875rem; }
      .overview-card { padding: 1.25rem 1.1rem; }
      .quiz-card { padding: 1.25rem 1.1rem; }
      .result-card { padding: 1.25rem 1.1rem; }
      .overview-title { font-size: 1.6rem !important; }
      .specs-grid { grid-template-columns: 1fr; }
      .form-grid-2 { grid-template-columns: 1fr; gap: 0.6rem; }
      .share-btns { width: 100%; display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; }
      .share-btns .btn { width: 100%; text-align: center; justify-content: center; }
      .share-info { width: 100%; flex-direction: column; align-items: flex-start; }
      .share-url-box { width: 100%; }
      .result-actions { flex-direction: column; align-items: stretch; }
      .result-actions .btn { width: 100%; margin: 0; text-align: center; justify-content: center; }
      .quiz-footer { flex-direction: column; gap: 0.75rem; }
      .quiz-footer button { width: 100%; text-align: center; justify-content: center; }
      .cert-award-banner { padding: 1rem; }
      .cert-award-banner .btn { width: 100%; justify-content: center; text-align: center; }
      .student-id-box { padding: 1rem !important; }
      .email-field-wrap { grid-column: 1 / -1; }
      .start-btn { font-size: 0.95rem !important; padding: 0.875rem 1rem !important; }
      .modal-content { padding: 1.25rem 1rem !important; max-width: 96vw !important; }
      .badge-row { gap: 0.35rem; }
      .overview-card { padding: 1.1rem 1rem; }
    }

    /* Disqualified Overlay */
    .disqualified-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(6px);
    }
    .disqualified-card {
      background: #ffffff;
      border-radius: 1rem;
      padding: 3rem 2.5rem;
      max-width: 480px;
      width: 90%;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
    }
    .dq-icon { font-size: 4rem; margin-bottom: 1rem; }
    .disqualified-card h2 { font-size: 1.75rem; font-weight: 800; color: var(--color-danger); margin: 0 0 0.75rem; }
    .disqualified-card p { font-size: 0.975rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }
    .dq-details {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1.25rem;
      padding: 0.75rem 1rem;
      background: var(--color-danger-bg);
      border: 1px solid var(--color-danger-border);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-danger);
    }
    .warning-toast {
      background: var(--color-warning) !important;
      color: #000 !important;
    }
  `]
})
export class QuizPlayerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly quizService = inject(QuizService);
  readonly authService = inject(AuthService);

  readonly quiz = signal<Quiz | null>(null);
  readonly result = signal<QuizAttemptResult | null>(null);
  readonly currentQuestionIndex = signal(0);
  readonly isLoading = signal(true);
  readonly isError = signal(false);
  readonly isSlowLoad = signal(false);
  readonly retryCountdown = signal(0);
  readonly retryAttempt = signal(0);
  readonly emailAlreadyUsed = signal(false);
  readonly showToast = signal(false);
  readonly showQrModal = signal(false);
  readonly isStarted = signal(false);
  readonly remainingSeconds = signal<number>(15 * 60);
  readonly showMissingDetailsModal = signal(false);

  private slowLoadTimer: any = null;
  private retryTimer: any = null;
  private countdownInterval: any = null;
  
  studentDetails = {
    studentName: '',
    email: '',
    rollNumber: '',
    phoneNumber: '',
    className: '',
    department: ''
  };

  readonly QuestionType = QuestionType;
  private selectedAnswersMap = new Map<string, string[]>();
  private quizId: string = '';
  private timerInterval: any = null;
  isPublicMode: boolean = false;
  focusLostCount: number = 0;
  cheatWarningCount: number = 0;
  showFocusWarning = signal(false);
  readonly isDisqualified = signal(false);

  @HostListener('window:blur')
  onWindowBlur() {
    if (this.isStarted() && !this.result() && !this.isDisqualified()) {
      this.focusLostCount++;
      this.cheatWarningCount++;
      if (this.cheatWarningCount >= 2) {
        // Second violation: disqualify and auto-submit
        this.disqualifyAndSubmit();
      } else {
        // First violation: show warning
        this.showFocusWarning.set(true);
        setTimeout(() => this.showFocusWarning.set(false), 5000);
      }
    }
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: Event) {
    if (this.isStarted() && !this.result()) {
      event.preventDefault();
    }
  }

  @HostListener('copy', ['$event'])
  @HostListener('paste', ['$event'])
  @HostListener('cut', ['$event'])
  onClipboard(event: Event) {
    if (this.isStarted() && !this.result()) {
      event.preventDefault();
    }
  }

  @HostListener('document:fullscreenchange', ['$event'])
  onFullScreenChange() {
    if (this.isStarted() && !this.result() && !this.isDisqualified()) {
      if (!document.fullscreenElement) {
        this.focusLostCount++;
        this.cheatWarningCount++;
        if (this.cheatWarningCount >= 2) {
          this.disqualifyAndSubmit();
        } else {
          this.showFocusWarning.set(true);
          setTimeout(() => this.showFocusWarning.set(false), 5000);
          // Re-request fullscreen after a short delay
          setTimeout(() => {
            if (this.isStarted() && !this.result()) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          }, 1500);
        }
      }
    }
  }

  ngOnInit(): void {
    const defaultName = `${this.authService.currentUser()?.firstName || ''} ${this.authService.currentUser()?.lastName || ''}`.trim();
    if (defaultName) {
      this.studentDetails.studentName = defaultName;
    }
    
    // Check if it's public route OR if the user is not logged in (to allow public submission if they just copy the internal link)
    if (this.router.url.includes('/public/quiz') || this.router.url.includes('/q/') || !this.authService.isAuthenticated()) {
      this.isPublicMode = true;
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || params.get('publicId') || params.get('shortId');
      if (id) {
        this.quizId = id;
        this.loadQuiz(id);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.slowLoadTimer) clearTimeout(this.slowLoadTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  loadQuiz(id: string): void {
    this.isLoading.set(true);
    this.isError.set(false);
    this.isSlowLoad.set(false);

    // Show "waking up" hint after 5 seconds
    if (this.slowLoadTimer) clearTimeout(this.slowLoadTimer);
    this.slowLoadTimer = setTimeout(() => {
      if (this.isLoading()) this.isSlowLoad.set(true);
    }, 5000);
    
    const requestObservable = this.isPublicMode 
      ? this.quizService.getPublicQuizById(id)
      : this.quizService.getQuizById(id);

    requestObservable.subscribe({
      next: (quizData) => {
        if (this.slowLoadTimer) clearTimeout(this.slowLoadTimer);
        this.isSlowLoad.set(false);
        this.quiz.set(quizData);
        this.isLoading.set(false);
        this.isError.set(false);
        this.retryAttempt.set(0);
        this.quizId = quizData.id;
        // After quiz loads, re-check if current email (if pre-filled) is already used
        this.onEmailChange();

        // Shuffle questions if configured
        if (quizData.shuffleQuestions && quizData.questions) {
          quizData.questions = this.shuffleArray([...quizData.questions]);
        }
        
        // Shuffle options if configured
        if (quizData.shuffleOptions && quizData.questions) {
          quizData.questions.forEach(q => {
            if (q.options) {
              q.options = this.shuffleArray([...q.options]);
            }
          });
        }

        // Check if user has an active ongoing attempt in progress for this quiz
        const rawOngoing = localStorage.getItem('qp_active_ongoing_attempt');
        if (rawOngoing) {
          try {
            const ongoing = JSON.parse(rawOngoing);
            if (ongoing && ongoing.quizId === id) {
              const timeMins = quizData.timeLimitMinutes || 15;
              const elapsedSeconds = Math.floor((Date.now() - ongoing.startTime) / 1000);
              const remaining = (timeMins * 60) - elapsedSeconds;

              if (remaining > 0) {
                this.isStarted.set(true);
                this.remainingSeconds.set(remaining);
                this.startTimerInterval();
              } else {
                localStorage.removeItem('qp_active_ongoing_attempt');
              }
            }
          } catch (e) {
            console.error('Error parsing ongoing attempt', e);
          }
        }
      },
      error: () => {
        if (this.slowLoadTimer) clearTimeout(this.slowLoadTimer);
        this.isSlowLoad.set(false);
        this.isLoading.set(false);
        this.retryAttempt.update(n => n + 1);

        // Auto-retry up to 3 times with a countdown
        if (this.retryAttempt() < 4) {
          this.isError.set(true);
          this.startRetryCountdown();
        } else {
          // Max retries reached — show error with manual retry button
          this.isError.set(true);
          this.retryCountdown.set(0);
        }
      }
    });
  }

  startRetryCountdown(): void {
    const delay = 10; // seconds before auto-retry
    this.retryCountdown.set(delay);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      const next = this.retryCountdown() - 1;
      this.retryCountdown.set(next);
      if (next <= 0) {
        clearInterval(this.countdownInterval);
        this.loadQuiz(this.quizId);
      }
    }, 1000);
  }

  retryLoad(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.retryAttempt.set(0);
    this.loadQuiz(this.quizId);
  }

  /** Called every time the email field changes — checks localStorage for duplicate */
  onEmailChange(): void {
    const email = (this.studentDetails.email || '').trim().toLowerCase();
    if (!email || !this.quizId) {
      this.emailAlreadyUsed.set(false);
      return;
    }
    const key = `quiz_attempted_emails_${this.quizId}`;
    const raw = localStorage.getItem(key);
    const used: string[] = raw ? JSON.parse(raw) : [];
    this.emailAlreadyUsed.set(used.includes(email));
  }

  /** Records an email as used for this quiz in localStorage (called after successful submit) */
  private recordEmailUsed(): void {
    const email = (this.studentDetails.email || '').trim().toLowerCase();
    if (!email || !this.quizId) return;
    const key = `quiz_attempted_emails_${this.quizId}`;
    const raw = localStorage.getItem(key);
    const used: string[] = raw ? JSON.parse(raw) : [];
    if (!used.includes(email)) {
      used.push(email);
      localStorage.setItem(key, JSON.stringify(used));
    }
  }

  startQuiz(): void {
    const timeMins = this.quiz()?.timeLimitMinutes || 15;
    const ongoingPayload = {
      quizId: this.quizId,
      quizTitle: this.quiz()?.title || 'Knowledge Assessment',
      category: this.quiz()?.category || 'General',
      timeLimitMinutes: timeMins,
      startTime: Date.now()
    };
    localStorage.setItem('qp_active_ongoing_attempt', JSON.stringify(ongoingPayload));

    this.isStarted.set(true);
    this.remainingSeconds.set(timeMins * 60);
    this.startTimerInterval();
    // Request fullscreen for anti-cheat
    document.documentElement.requestFullscreen().catch(() => {
      // Fullscreen not supported or denied — continue anyway
    });
  }

  disqualifyAndSubmit(): void {
    if (this.isDisqualified()) return; // prevent double-call
    this.isDisqualified.set(true);
    this.showFocusWarning.set(false);
    if (this.timerInterval) clearInterval(this.timerInterval);
    localStorage.removeItem('qp_active_ongoing_attempt');
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    // Auto-submit with disqualified flag
    const q = this.quiz();
    if (!q) return;
    const answersList: StudentAnswerItem[] = [];
    q.questions.forEach(ques => {
      const selected = this.selectedAnswersMap.get(ques.id) || [];
      answersList.push({
        questionId: ques.id,
        selectedOptionId: selected[0] || undefined,
        selectedOptionIds: selected
      });
    });
    const payload = {
      answers: answersList,
      ...this.studentDetails,
      focusLostCount: this.focusLostCount,
      isDisqualified: true,
      disqualificationReason: 'Student switched tabs or left the exam window multiple times'
    };
    const submitObs = this.isPublicMode
      ? this.quizService.submitPublicQuizAttempt(q.id, payload)
      : this.quizService.submitQuizAttempt(q.id, payload);
    submitObs.subscribe({
      next: () => {},
      error: () => {}
    });
  }

  private startTimerInterval(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds() <= 1) {
        clearInterval(this.timerInterval);
        this.remainingSeconds.set(0);
        if (this.quiz()?.autoSubmit !== false) {
          // Default to auto-submit if undefined, or if explicitly true
          this.submitQuiz();
        }
      } else {
        this.remainingSeconds.update(s => s - 1);
      }
    }, 1000);
  }

  getFormattedTime(): string {
    const total = this.remainingSeconds();
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  currentQuestion() {
    const q = this.quiz();
    if (!q || !q.questions || q.questions.length === 0) return null;
    return q.questions[this.currentQuestionIndex()];
  }

  setQuestionIndex(index: number): void {
    if (index >= 0 && index < (this.quiz()?.questions?.length || 0)) {
      this.currentQuestionIndex.set(index);
    }
  }

  nextQuestion(): void {
    this.setQuestionIndex(this.currentQuestionIndex() + 1);
  }

  prevQuestion(): void {
    this.setQuestionIndex(this.currentQuestionIndex() - 1);
  }

  isOptionSelected(questionId: string, optionId: string): boolean {
    const list = this.selectedAnswersMap.get(questionId);
    return list ? list.includes(optionId) : false;
  }

  selectOption(questionId: string, optionId: string, type: QuestionType): void {
    if (type === QuestionType.MultipleChoice) {
      let current = this.selectedAnswersMap.get(questionId) || [];
      if (current.includes(optionId)) {
        current = current.filter(id => id !== optionId);
      } else {
        current = [...current, optionId];
      }
      this.selectedAnswersMap.set(questionId, current);
    } else {
      this.selectedAnswersMap.set(questionId, [optionId]);
    }
  }

  isQuestionAnswered(questionId: string): boolean {
    const list = this.selectedAnswersMap.get(questionId);
    return !!list && list.length > 0;
  }

  submitQuiz(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    if (!this.isPublicMode && !this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (this.isPublicMode && (!this.studentDetails.studentName || !this.studentDetails.email)) {
      // Show the details modal instead of alert, so user can fill and continue
      this.showMissingDetailsModal.set(true);
      return;
    }

    const q = this.quiz();
    if (!q) return;

    const answersList: StudentAnswerItem[] = [];
    q.questions.forEach(ques => {
      const selected = this.selectedAnswersMap.get(ques.id) || [];
      answersList.push({
        questionId: ques.id,
        selectedOptionId: selected[0] || undefined,
        selectedOptionIds: selected
      });
    });

    const payload = { 
      answers: answersList, 
      ...this.studentDetails,
      focusLostCount: this.focusLostCount
    };

    const submitObs = this.isPublicMode 
      ? this.quizService.submitPublicQuizAttempt(q.id, payload)
      : this.quizService.submitQuizAttempt(q.id, payload);

    submitObs.subscribe({
      next: (res) => {
        localStorage.removeItem('qp_active_ongoing_attempt');
        this.recordEmailUsed(); // Mark this email as used for this quiz
        this.result.set(res);
      }
    });
  }

  submitQuizWithDetails(): void {
    if (!this.studentDetails.studentName || !this.studentDetails.email) {
      alert('Name and Email are required.');
      return;
    }
    this.showMissingDetailsModal.set(false);
    // Now proceed with actual submission
    this.submitQuiz();
  }

  // Helper method for array shuffling
  private shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  retakeQuiz(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.result.set(null);
    this.isStarted.set(false);
    this.selectedAnswersMap.clear();
    this.currentQuestionIndex.set(0);
  }

  getShareableUrl(): string {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const defaultOrigin = `${protocol}//${host}${port}`;
    const env = (window as any).__env__ || null;
    const devOverride = env?.devHostOverride || null;
    const origin = (host === 'localhost' || host === '127.0.0.1') && devOverride ? devOverride : defaultOrigin;
    const shortId = this.quiz()?.shortId || this.quizId;
    return `${origin}/q/${shortId}`;
  }

  encodeUrl(url: string): string {
    return encodeURIComponent(url);
  }

  copyShareLink(): void {
    navigator.clipboard.writeText(this.getShareableUrl()).then(() => {
      this.showToast.set(true);
      setTimeout(() => this.showToast.set(false), 3000);
    });
  }

  toggleQrModal(): void {
    this.showQrModal.update(v => !v);
  }
}

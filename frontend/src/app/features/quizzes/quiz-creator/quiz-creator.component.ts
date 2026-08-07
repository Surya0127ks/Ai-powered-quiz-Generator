import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { AuthService } from '../../../core/services/auth.service';
import { QuestionBankService, DomainTopicItem, SubTopicItem } from '../../../core/services/question-bank.service';
import { QuestionType, CreateQuizQuestionItem } from '../../../core/models/quiz.model';

@Component({
  selector: 'app-quiz-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="creator-container">
      <header class="creator-header">
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        <div class="header-title-row">
          <div>
            <h1>Create Assessment Quiz</h1>
            <p>Generate high-quality assessment questions using live Groq AI or compose questions manually.</p>
          </div>
        </div>
      </header>

      <!-- Primary vs Secondary Mode Switch Bar -->
      <div class="tab-switch-bar">
        <button
          type="button"
          [class.active]="creationMode() === 'smart'"
          (click)="setMode('smart')"
          class="tab-btn tab-btn-ai"
        >
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
          <span>✨ Generate with AI (Recommended)</span>
        </button>

        <button
          type="button"
          [class.active]="creationMode() === 'manual'"
          (click)="setMode('manual')"
          class="tab-btn"
        >
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>Write Questions Manually</span>
        </button>
      </div>

      <!-- Error Notification with Retry & Custom Key Option -->
      @if (errorMessage()) {
        <div class="alert alert-danger margin-bottom">
          <div class="alert-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
          @if (creationMode() === 'smart') {
            <div class="error-actions margin-top-xs">
              @if (!showApiKeyInput()) {
                <button type="button" (click)="showApiKeyInput.set(true)" class="btn btn-outline btn-sm">
                  🔑 Enter Custom Groq API Key
                </button>
              }
              <button (click)="generateSmartQuestions()" [disabled]="isGenerating()" class="btn btn-danger btn-sm">
                🔄 Retry AI Generation
              </button>
            </div>
          }
        </div>
      }

      @if (showSuccessToast()) {
        <div class="toast-notification">
          {{ successToastMessage() }}
        </div>
      }

      <!-- AI Question Generation Panel (Primary Flow) -->
      @if (creationMode() === 'smart') {
        <div class="saas-card generator-panel margin-bottom">
          <div class="panel-header">
            <div class="badge badge-ai mb-2">✨ RECOMMENDED · LIVE GROQ AI</div>
            <h3>AI Quiz Prompt & Generator</h3>
            <p class="panel-desc">Enter any topic prompt or choose a domain category. Groq LLM will generate fresh, custom questions live.</p>
          </div>

          <div class="form-group">
            <label>Topic / Prompt *</label>
            <input
              type="text"
              [(ngModel)]="customTopic"
              [ngModelOptions]="{standalone: true}"
              placeholder="e.g. Quantum Computing, React Server Components, Python Data Structures, World History"
              class="input-control"
              [disabled]="isGenerating()"
            />
          </div>

          <div class="form-grid-2 margin-top-sm">
            <div class="form-group">
              <label>Domain Category (Optional)</label>
              <select
                [(ngModel)]="selectedDomainId"
                [ngModelOptions]="{standalone: true}"
                (change)="onDomainChange()"
                class="input-control"
                [disabled]="isGenerating()"
              >
                <option value="">Or select curated category...</option>
                @for (d of domainTopics(); track d.id) {
                  <option [value]="d.id">{{ d.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Sub-topic (Optional)</label>
              <select
                [(ngModel)]="selectedSubTopicId"
                [ngModelOptions]="{standalone: true}"
                class="input-control"
                [disabled]="!selectedDomainId || isGenerating()"
              >
                <option value="">All Sub-topics</option>
                @for (s of availableSubTopics(); track s.id) {
                  <option [value]="s.id">{{ s.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="form-grid-2 margin-top-sm">
            <div class="form-group">
              <label>Number of Questions</label>
              <select
                [(ngModel)]="requestedQuestionCount"
                [ngModelOptions]="{standalone: true}"
                class="input-control"
                [disabled]="isGenerating()"
              >
                <option [value]="5">5 Questions</option>
                <option [value]="10">10 Questions</option>
                <option [value]="15">15 Questions</option>
                <option [value]="20">20 Questions</option>
              </select>
            </div>

            <div class="form-group">
              <label>Difficulty Filter</label>
              <select
                [(ngModel)]="selectedDifficulty"
                [ngModelOptions]="{standalone: true}"
                class="input-control"
                [disabled]="isGenerating()"
              >
                <option value="Mixed">Mixed Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <!-- Hidden by default, collapsible toggle or auto-shown on API failure -->
          <div class="key-toggle-row margin-top-sm">
            <button type="button" (click)="showApiKeyInput.set(!showApiKeyInput())" class="toggle-key-link">
              ⚙️ {{ showApiKeyInput() ? 'Hide Custom API Key' : 'Use Custom Groq API Key' }}
            </button>
          </div>

          @if (showApiKeyInput()) {
            <div class="form-group margin-top-xs">
              <label>Custom Groq API Key <span class="optional-text">(Optional)</span></label>
              <input
                type="password"
                [(ngModel)]="customApiKey"
                [ngModelOptions]="{standalone: true}"
                placeholder="gsk_..."
                class="input-control"
                [disabled]="isGenerating()"
              />
            </div>
          }

          <div class="panel-footer margin-top">
            <button
              type="button"
              (click)="generateSmartQuestions()"
              [disabled]="isGenerating()"
              class="btn btn-ai width-full"
            >
              @if (isGenerating()) {
                <span class="ai-spinner-row">
                  <svg class="ai-spinner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12" stroke-linecap="round"></circle>
                  </svg>
                  <span>Generating {{ requestedQuestionCount }} Questions via Groq AI...</span>
                </span>
              } @else {
                <span>✨ Generate & Pre-Fill Quiz Builder with Groq AI</span>
              }
            </button>
          </div>
        </div>

        <!-- Animated AI Generation Banner & Shimmer Skeletons while generating -->
        @if (isGenerating()) {
          <div class="ai-generating-loader margin-bottom">
            <div class="loader-header">
              <div class="ai-pulsing-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
              </div>
              <div>
                <h4>Groq AI is crafting your quiz questions...</h4>
                <p>Generating {{ requestedQuestionCount }} technical questions with answer choices and explanations live.</p>
              </div>
            </div>

            <div class="shimmer-card-list">
              <div class="shimmer-item">
                <div class="shimmer-line line-title"></div>
                <div class="shimmer-line line-option"></div>
                <div class="shimmer-line line-option short"></div>
              </div>
              <div class="shimmer-item">
                <div class="shimmer-line line-title"></div>
                <div class="shimmer-line line-option"></div>
              </div>
            </div>
          </div>
        }
      }

      <form [formGroup]="quizForm" (ngSubmit)="onSubmit(true)" class="creator-form-layout">
        <!-- Section 1: Quiz Details -->
        <div class="saas-card form-section">
          <h3>📌 Quiz Details & Settings</h3>
          <p class="section-desc">Configure title, passing score, and time limit for your quiz.</p>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="title">Quiz Title *</label>
              <input
                id="title"
                type="text"
                formControlName="title"
                placeholder="e.g. Advanced Angular Signals & Architecture"
                class="input-control"
              />
            </div>

            <div class="form-group">
              <label for="category">Category</label>
              <input
                id="category"
                type="text"
                formControlName="category"
                placeholder="e.g. Frontend / Computer Science"
                class="input-control"
              />
            </div>
          </div>

          <div class="form-group margin-top-sm">
            <label for="description">Description</label>
            <textarea
              id="description"
              formControlName="description"
              rows="2"
              placeholder="Internal description or notes (not shown to students)..."
              class="input-control"
            ></textarea>
          </div>

          <div class="form-group margin-top-sm">
            <label for="welcomeMessage">Welcome Message (Optional)</label>
            <textarea
              id="welcomeMessage"
              formControlName="welcomeMessage"
              rows="2"
              placeholder="e.g. Welcome to the midterm assessment. Good luck!"
              class="input-control"
            ></textarea>
          </div>

          <div class="form-group margin-top-sm">
            <label for="instructions">Instructions / Rules (Optional)</label>
            <textarea
              id="instructions"
              formControlName="instructions"
              rows="2"
              placeholder="Provide context, rules, or warnings for participants before starting..."
              class="input-control"
            ></textarea>
          </div>

          <div class="form-grid-3 margin-top-sm">
            <div class="form-group">
              <label for="passingScorePercentage">Passing Score (%) *</label>
              <input
                id="passingScorePercentage"
                type="number"
                formControlName="passingScorePercentage"
                min="1"
                max="100"
                class="input-control"
              />
            </div>

            <div class="form-group">
              <label for="timeLimitMinutes">Time Limit (Minutes)</label>
              <input
                id="timeLimitMinutes"
                type="number"
                formControlName="timeLimitMinutes"
                placeholder="Optional (e.g. 15)"
                class="input-control"
              />
            </div>

            <div class="form-group">
              <label for="difficulty">Difficulty Level</label>
              <select id="difficulty" formControlName="difficulty" class="input-control">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div class="form-grid-3 margin-top-sm">
            <div class="form-group">
              <label for="totalMarks">Total Marks (Optional)</label>
              <input id="totalMarks" type="number" formControlName="totalMarks" class="input-control" placeholder="Calculated automatically if left blank" />
            </div>

            <div class="form-group">
              <label for="negativeMarkingPoints">Negative Marking Points</label>
              <input id="negativeMarkingPoints" type="number" formControlName="negativeMarkingPoints" class="input-control" placeholder="Points deducted per wrong answer (0 for none)" />
            </div>

            <div class="form-group">
              <label for="expiryDateUtc">Expiry Date / Deadline</label>
              <input id="expiryDateUtc" type="datetime-local" formControlName="expiryDateUtc" class="input-control" />
            </div>

            <div class="form-group">
              <label for="maxStudents">
                👥 Max Students Allowed
                <span class="label-hint">Quiz closes after this many attempts. Admin can extend up to 2 times.</span>
              </label>
              <input
                id="maxStudents"
                type="number"
                formControlName="maxStudents"
                placeholder="Default: 15"
                min="1"
                class="input-control"
              />
            </div>
          </div>

          <div class="form-grid-2 margin-top-sm" style="align-items: center; gap: 1.5rem; background: var(--bg-hover); padding: 1rem; border-radius: 0.5rem;">
            <div>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                <input type="checkbox" formControlName="shuffleQuestions" class="check-control" />
                Shuffle Questions
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; margin-top: 0.5rem;">
                <input type="checkbox" formControlName="shuffleOptions" class="check-control" />
                Shuffle Options
              </label>
            </div>
            <div>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                <input type="checkbox" formControlName="enableCertificate" class="check-control" />
                Issue Certificate on Pass
              </label>
              @if (quizForm.get('enableCertificate')?.value) {
                <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; margin-top: 0.5rem; margin-left: 1.5rem; color: var(--text-muted) !important;">
                  <input type="checkbox" formControlName="certificateForTopperOnly" class="check-control" />
                  Only issue to Top Scorer (Topper)
                </label>
              }
              <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; margin-top: 0.5rem;">
                <input type="checkbox" formControlName="autoSubmit" class="check-control" />
                Auto-Submit on Time Up
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; margin-top: 0.5rem;">
                <input type="checkbox" formControlName="showResultsAfterSubmission" class="check-control" />
                Show Detailed Results After Submission
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; margin-top: 0.5rem;">
                <input type="checkbox" formControlName="showCorrectAnswers" class="check-control" />
                Show Correct Answers in Results
              </label>
            </div>
          </div>
        </div>

        <!-- Quick Publish Action Bar (Top) — appears once questions are loaded -->
        @if (questionsArray.length > 0) {
          <div class="quick-publish-bar margin-top">
            <div class="qpb-left">
              <span class="qpb-icon">⚡</span>
              <div>
                <span class="qpb-title">Ready to publish?</span>
                <span class="qpb-desc">{{ questionsArray.length }} questions loaded — publish now or review below first.</span>
              </div>
            </div>
            <div class="qpb-actions">
              @if (authService.userRole() !== 3) {
                <button type="button" (click)="onSubmit(false)" [disabled]="quizForm.invalid || isLoading()" class="btn btn-outline btn-sm">
                  @if (isSavingDraft()) {
                    <span class="ai-spinner-row"><svg class="ai-spinner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12" stroke-linecap="round"></circle></svg><span>Saving...</span></span>
                  } @else {
                    <span>Save Draft</span>
                  }
                </button>
              }
              <button type="button" (click)="onSubmit(true)" [disabled]="quizForm.invalid || isLoading()" class="btn btn-ai btn-sm">
                @if (isPublishing()) {
                  <span class="ai-spinner-row"><svg class="ai-spinner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12" stroke-linecap="round"></circle></svg><span>Publishing...</span></span>
                } @else {
                  <span>🚀 {{ authService.userRole() === 3 ? 'Save & Take Assessment' : 'Publish & Generate Link' }}</span>
                }
              </button>
            </div>
          </div>
        }

        <!-- Section 2: Questions Editor -->
        <div class="saas-card form-section margin-top">
          <div class="section-header-row">
            <div>
              <h3>❓ Questions ({{ questionsArray.length }})</h3>
              <p class="section-desc">Review, edit, add, or delete individual questions before publishing.</p>
            </div>
            <button type="button" (click)="addQuestion()" class="btn btn-outline btn-sm">➕ Add Blank Question</button>
          </div>

          <div formArrayName="questions" class="questions-list">
            @for (qGroup of questionsArray.controls; track $index; let qIdx = $index) {
              <div [formGroupName]="qIdx" class="question-card">
                <div class="q-header">
                  <span class="q-badge">Question #{{ qIdx + 1 }}</span>
                  @if (questionsArray.length > 1) {
                    <button type="button" (click)="removeQuestion(qIdx)" class="btn-remove">Delete</button>
                  }
                </div>

                <div class="form-group">
                  <input
                    type="text"
                    formControlName="questionText"
                    placeholder="Enter question statement here..."
                    class="input-control font-weight-bold"
                  />
                </div>

                <div class="form-grid-2 margin-top-sm">
                  <div class="form-group">
                    <label>Question Type</label>
                    <select
                      formControlName="type"
                      (change)="onQuestionTypeChange(qIdx)"
                      class="input-control"
                    >
                      <option [value]="QuestionType.SingleChoice">Multiple Choice (Single Answer)</option>
                      <option [value]="QuestionType.TrueFalse">True / False</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Points</label>
                    <input type="number" formControlName="points" min="1" class="input-control" />
                  </div>
                </div>

                <div class="form-group margin-top-sm">
                  <label>Explanation / Answer Key Notes</label>
                  <input
                    type="text"
                    formControlName="explanation"
                    placeholder="Explanation shown to participants after submission..."
                    class="input-control"
                  />
                </div>

                <!-- Answer Options -->
                <div class="options-wrapper">
                  <div class="options-header">
                    <label>Answer Options (Check the correct answer)</label>
                    @if (qGroup.get('type')?.value === QuestionType.SingleChoice) {
                      <button type="button" (click)="addOption(qIdx)" class="link-btn">+ Add Option</button>
                    }
                  </div>

                  <div formArrayName="options">
                    @for (optGroup of getOptionsArray(qIdx).controls; track $index; let oIdx = $index) {
                      <div [formGroupName]="oIdx" class="option-row">
                        <input
                          type="checkbox"
                          formControlName="isCorrect"
                          title="Mark as correct answer"
                          class="check-control"
                        />
                        <input
                          type="text"
                          formControlName="optionText"
                          placeholder="Option {{ oIdx + 1 }} text..."
                          class="input-control option-input"
                        />
                        @if (getOptionsArray(qIdx).length > 2 && qGroup.get('type')?.value === QuestionType.SingleChoice) {
                          <button type="button" (click)="removeOption(qIdx, oIdx)" class="btn-opt-delete">✕</button>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Submission Bar -->
        <div class="form-actions-bar margin-top">
          @if (authService.userRole() !== 3) {
            <button type="button" (click)="onSubmit(false)" [disabled]="quizForm.invalid || isLoading()" class="btn btn-outline">
              @if (isSavingDraft()) {
                <span class="ai-spinner-row">
                  <svg class="ai-spinner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12" stroke-linecap="round"></circle>
                  </svg>
                  <span>Saving Draft...</span>
                </span>
              } @else {
                <span>Save as Draft</span>
              }
            </button>
          }
          <button type="button" (click)="onSubmit(true)" [disabled]="quizForm.invalid || isLoading()" class="btn btn-primary">
            @if (isPublishing()) {
              <span class="ai-spinner-row">
                <svg class="ai-spinner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12" stroke-linecap="round"></circle>
                </svg>
                <span>{{ authService.userRole() === 3 ? 'Starting...' : 'Publishing...' }}</span>
              </span>
            } @else {
              <span>🚀 {{ authService.userRole() === 3 ? 'Start Generated Assessment' : 'Publish' }}</span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .creator-container { max-width: 960px; margin: 0 auto; padding: 2.0rem 1.5rem; }
    .creator-header { margin-bottom: 1.5rem; }
    .back-link { color: var(--color-primary) !important; font-weight: 600; text-decoration: none; font-size: 0.875rem; margin-bottom: 0.5rem; display: inline-block; }
    .header-title-row h1 { font-size: 2.0rem; font-weight: 800; color: var(--text-primary) !important; margin: 0.25rem 0; letter-spacing: -0.02em; }
    .header-title-row p { font-size: 0.95rem; color: var(--text-secondary) !important; margin: 0; }

    /* Mode Switcher */
    .tab-switch-bar {
      display: flex;
      gap: 0.5rem;
      background: #ffffff;
      border: 1px solid var(--border-hairline);
      padding: 0.35rem;
      border-radius: 0.5rem;
      margin-bottom: 1.75rem;
    }
    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.0rem;
      border-radius: 0.375rem;
      border: none;
      background: transparent;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      .tab-svg { width: 18px; height: 18px; stroke: var(--text-secondary); }
      &.active {
        background: var(--color-primary-50);
        color: var(--color-primary) !important;
        .tab-svg { stroke: var(--color-primary); }
      }
      &.tab-btn-ai.active {
        background: var(--color-ai-bg);
        color: var(--color-ai-purple) !important;
        .tab-svg { stroke: var(--color-ai-purple); }
      }
    }

    /* Generator Panel */
    .generator-panel {
      padding: 1.75rem;
      background: #ffffff;
      border: 1px solid var(--color-ai-border);
      border-top: 4px solid var(--color-ai-purple);
      border-radius: 0.75rem;
      .panel-desc { font-size: 0.875rem; color: var(--text-secondary) !important; margin: 0.25rem 0 1.25rem 0; }
    }
    .margin-top-sm { margin-top: 0.85rem; }
    .margin-top-xs { margin-top: 0.5rem; }
    .margin-top { margin-top: 1.5rem; }
    .margin-bottom { margin-bottom: 1.5rem; }
    .optional-text { font-weight: 400; color: var(--text-muted) !important; font-size: 0.75rem; }
    .width-full { width: 100%; }
    .mb-2 { margin-bottom: 0.5rem; }

    /* Quick Publish Action Bar */
    .quick-publish-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.35rem;
      background: linear-gradient(135deg, var(--color-ai-bg), var(--color-primary-50));
      border: 1.5px solid var(--color-ai-border);
      border-left: 4px solid var(--color-ai-purple);
      border-radius: 0.5rem;
      animation: fadein 0.3s ease;
    }
    @keyframes fadein { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .qpb-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex: 1;
      min-width: 0;
    }
    .qpb-icon {
      font-size: 1.4rem;
      flex-shrink: 0;
    }
    .qpb-title {
      display: block;
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--color-ai-purple) !important;
    }
    .qpb-desc {
      display: block;
      font-size: 0.8rem;
      color: var(--text-muted) !important;
      margin-top: 0.1rem;
    }
    .qpb-actions {
      display: flex;
      gap: 0.65rem;
      align-items: center;
      flex-shrink: 0;
    }

    .key-toggle-row { text-align: right; }
    .toggle-key-link {
      background: none;
      border: none;
      color: var(--text-muted) !important;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      &:hover { color: var(--color-primary) !important; }
    }

    .error-actions { display: flex; gap: 0.5rem; align-items: center; }

    /* AI Spinner & Loading Shimmer */
    .ai-spinner-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
    }
    .ai-spinner-svg {
      width: 18px;
      height: 18px;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .ai-generating-loader {
      background: #ffffff;
      border: 1.5px solid var(--color-ai-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15);
      animation: pulseGlow 2s ease-in-out infinite alternate;
    }
    @keyframes pulseGlow {
      0% { border-color: #DDD6FE; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.12); }
      100% { border-color: #7C3AED; box-shadow: 0 6px 25px rgba(124, 58, 237, 0.25); }
    }

    .loader-header {
      display: flex;
      align-items: center;
      gap: 1.0rem;
      margin-bottom: 1.25rem;
      h4 { font-size: 1.05rem; font-weight: 800; color: var(--text-primary) !important; margin: 0; }
      p { font-size: 0.85rem; color: var(--text-muted) !important; margin-top: 0.15rem; }
    }
    .ai-pulsing-icon {
      width: 44px;
      height: 44px;
      border-radius: 0.65rem;
      background: var(--color-ai-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      animation: scalePulse 1.5s ease-in-out infinite;
    }
    @keyframes scalePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }

    .shimmer-card-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .shimmer-item {
      background: var(--bg-app);
      border: 1px solid var(--border-hairline);
      border-radius: 0.5rem;
      padding: 1.0rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .shimmer-line {
      height: 12px;
      border-radius: 4px;
      background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
      background-size: 200% 100%;
      animation: shimmerMove 1.5s infinite;
    }
    .line-title { width: 70%; height: 14px; }
    .line-option { width: 90%; }
    .line-option.short { width: 50%; }

    @keyframes shimmerMove {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .form-section { padding: 1.5rem; h3 { font-size: 1.15rem; font-weight: 800; color: var(--text-primary) !important; margin: 0; } .section-desc { font-size: 0.85rem; color: var(--text-muted) !important; margin: 0.25rem 0 1.25rem 0; } }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.0rem; }
    .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.0rem; }

    .margin-top { margin-top: 1.5rem; }
    .margin-bottom { margin-bottom: 1.5rem; }
    .section-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }

    .questions-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .question-card { background: var(--bg-app); border: 1px solid var(--border-hairline); padding: 1.35rem; border-radius: 0.75rem; }
    .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; }
    .q-badge { font-size: 0.75rem; font-weight: 700; background: var(--color-primary-50); color: var(--color-primary) !important; padding: 0.2rem 0.6rem; border-radius: 9999px; border: 1px solid var(--color-primary-200); }
    .btn-remove { background: none; border: none; color: var(--color-danger) !important; font-size: 0.8rem; font-weight: 700; cursor: pointer; }

    .options-wrapper { margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px dashed var(--border-input); }
    .options-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; label { font-size: 0.825rem; font-weight: 700; color: var(--text-primary) !important; } }
    .link-btn { background: none; border: none; color: var(--color-primary) !important; font-weight: 700; font-size: 0.8rem; cursor: pointer; }

    .option-row { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.5rem; }
    .check-control { width: 18px; height: 18px; accent-color: var(--color-primary); cursor: pointer; }
    .option-input { flex-grow: 1; }
    .btn-opt-delete { background: var(--color-danger-bg); border: 1px solid var(--color-danger-border); color: var(--color-danger); border-radius: 4px; padding: 0.35rem 0.6rem; font-weight: 700; cursor: pointer; }

    .form-actions-bar { display: flex; justify-content: flex-end; gap: 0.85rem; }
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

    .alert-danger {
      background: var(--color-danger-bg);
      border: 1px solid var(--color-danger-border);
      color: var(--color-danger) !important;
      padding: 1.0rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      .alert-content { display: flex; align-items: center; gap: 0.5rem; svg { stroke: var(--color-danger); flex-shrink: 0; } }
    }
    
    @media (max-width: 768px) {
      .quick-publish-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .qpb-actions {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      .qpb-actions .btn {
        width: 100%;
        justify-content: center;
      }
    }
    
    @media (max-width: 600px) {
      .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; }
      .qpb-actions {
        grid-template-columns: 1fr;
      }
      .creator-container { padding: 1.25rem 1rem; }
      .q-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
      .q-header .btn-remove { width: 100%; text-align: center; justify-content: center; }
      .options-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
      .options-header .link-btn { align-self: flex-start; }
      .form-actions-bar { flex-direction: column-reverse; gap: 0.75rem; }
      .form-actions-bar .btn { width: 100%; justify-content: center; margin: 0; }
      .header-title-row h1 { font-size: 1.6rem; }
      .option-row { flex-direction: row; flex-wrap: wrap; }
      .btn-opt-delete { width: 100%; text-align: center; }
    }
  `]
})
export class QuizCreatorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly quizService = inject(QuizService);
  private readonly questionBankService = inject(QuestionBankService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  public readonly authService = inject(AuthService);

  readonly QuestionType = QuestionType;
  readonly creationMode = signal<'smart' | 'manual'>('smart');
  readonly isLoading = signal(false);
  readonly isGenerating = signal(false);
  readonly isPublishing = signal(false);
  readonly isSavingDraft = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccessToast = signal(false);
  readonly successToastMessage = signal('');
  readonly showApiKeyInput = signal(false);

  readonly domainTopics = signal<DomainTopicItem[]>([]);
  readonly availableSubTopics = signal<SubTopicItem[]>([]);

  customTopic = '';
  customApiKey = '';
  selectedDomainId = '';
  selectedSubTopicId = '';
  requestedQuestionCount = 10;
  selectedDifficulty = 'Mixed';

  readonly quizForm = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    category: ['General'],
    difficulty: ['Intermediate'],
    passingScorePercentage: [70, [Validators.required, Validators.min(1), Validators.max(100)]],
    timeLimitMinutes: [null as number | null],
    negativeMarkingPoints: [null as number | null, [Validators.min(0)]],
    shuffleQuestions: [false],
    shuffleOptions: [false],
    expiryDateUtc: [null as string | null],
    enableCertificate: [false],
    certificateForTopperOnly: [false],
    autoSubmit: [false],
    showResultsAfterSubmission: [true],
    showCorrectAnswers: [true],
    totalMarks: [null as number | null],
    welcomeMessage: [''],
    instructions: [''],
    maxStudents: [15, [Validators.min(1)]],
    questions: this.fb.array([this.createQuestionGroup()])
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'manual') {
        this.creationMode.set('manual');
      }
      if (params['topic']) {
        this.customTopic = params['topic'];
        this.quizForm.patchValue({
          title: `${params['topic']} Knowledge Assessment`,
          category: params['topic']
        });
      }
      if (params['auto'] === 'true' && this.customTopic) {
        this.isGenerating.set(true);
        setTimeout(() => {
          this.generateSmartQuestions();
        }, 100);
      }
    });

    this.questionBankService.getDomains().subscribe({
      next: (domains) => {
        if (domains && domains.length > 0) {
          this.domainTopics.set(domains);
        }
      },
      error: () => {}
    });
  }

  setMode(mode: 'manual' | 'smart'): void {
    this.creationMode.set(mode);
    this.errorMessage.set(null);
  }

  onDomainChange(): void {
    const domain = this.domainTopics().find(d => d.id === this.selectedDomainId);
    if (domain) {
      this.availableSubTopics.set(domain.subTopics || []);
      if (!this.customTopic) {
        this.customTopic = domain.name;
      }
      this.quizForm.patchValue({
        title: `${domain.name} Knowledge Assessment`,
        category: domain.name
      });
    } else {
      this.availableSubTopics.set([]);
    }
    this.selectedSubTopicId = '';
  }

  generateSmartQuestions(): void {
    const topicToUse = this.customTopic.trim() || (this.domainTopics().find(d => d.id === this.selectedDomainId)?.name ?? 'General Knowledge');

    if (!topicToUse) {
      this.errorMessage.set('Please enter a topic prompt or select a domain category.');
      return;
    }

    this.isGenerating.set(true);
    this.errorMessage.set(null);

    this.questionBankService.generateQuestions({
      domainTopicId: this.selectedDomainId || undefined,
      subTopicId: this.selectedSubTopicId || undefined,
      customTopic: topicToUse,
      questionCount: Number(this.requestedQuestionCount),
      difficulty: this.selectedDifficulty,
      apiKey: this.customApiKey ? this.customApiKey.trim() : undefined
    }).subscribe({
      next: (generatedQuestions) => {
        this.isGenerating.set(false);
        if (generatedQuestions && generatedQuestions.length > 0) {
          if (!this.quizForm.value.title) {
            this.quizForm.patchValue({
              title: `${topicToUse} Assessment`,
              category: topicToUse
            });
          }
          this.populateQuestionsArray(generatedQuestions);
          this.successToastMessage.set(`✨ Generated ${generatedQuestions.length} live questions via Groq AI!`);
          this.showSuccessToast.set(true);
          setTimeout(() => this.showSuccessToast.set(false), 3500);
        } else {
          this.showApiKeyInput.set(true);
          this.errorMessage.set('Groq AI returned no questions. Please enter your API key or check your topic prompt and click Retry.');
        }
      },
      error: (err) => {
        this.isGenerating.set(false);
        this.showApiKeyInput.set(true);
        const msg = err.error?.message || 'Failed to generate questions via Groq AI. You can enter a custom Groq API key below and click Retry.';
        this.errorMessage.set(msg);
      }
    });
  }

  populateQuestionsArray(questions: CreateQuizQuestionItem[]): void {
    const qArray = this.questionsArray;
    qArray.clear();

    questions.forEach(q => {
      const qGroup = this.fb.group({
        questionText: [q.questionText, Validators.required],
        type: [q.type || QuestionType.SingleChoice, Validators.required],
        points: [q.points || 1, [Validators.required, Validators.min(1)]],
        explanation: [q.explanation || ''],
        options: this.fb.array([])
      });

      const optsArray = qGroup.get('options') as FormArray;
      (q.options || []).forEach(opt => {
        optsArray.push(this.fb.group({
          optionText: [opt.optionText, Validators.required],
          isCorrect: [opt.isCorrect || false]
        }));
      });

      qArray.push(qGroup);
    });
  }

  get questionsArray(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getOptionsArray(qIndex: number): FormArray {
    return this.questionsArray.at(qIndex).get('options') as FormArray;
  }

  createQuestionGroup(): FormGroup {
    return this.fb.group({
      questionText: ['', Validators.required],
      type: [QuestionType.SingleChoice, Validators.required],
      points: [1, [Validators.required, Validators.min(1)]],
      explanation: [''],
      options: this.fb.array([
        this.fb.group({ optionText: '', isCorrect: true }),
        this.fb.group({ optionText: '', isCorrect: false }),
        this.fb.group({ optionText: '', isCorrect: false }),
        this.fb.group({ optionText: '', isCorrect: false })
      ])
    });
  }

  addQuestion(): void {
    this.questionsArray.push(this.createQuestionGroup());
  }

  removeQuestion(qIndex: number): void {
    if (this.questionsArray.length > 1) {
      this.questionsArray.removeAt(qIndex);
    }
  }

  addOption(qIndex: number): void {
    this.getOptionsArray(qIndex).push(
      this.fb.group({ optionText: '', isCorrect: false })
    );
  }

  removeOption(qIndex: number, oIndex: number): void {
    const opts = this.getOptionsArray(qIndex);
    if (opts.length > 2) {
      opts.removeAt(oIndex);
    }
  }

  onQuestionTypeChange(qIndex: number): void {
    const qGroup = this.questionsArray.at(qIndex);
    const type = qGroup.get('type')?.value;
    const opts = this.getOptionsArray(qIndex);

    opts.clear();
    if (type === QuestionType.TrueFalse) {
      opts.push(this.fb.group({ optionText: 'True', isCorrect: true }));
      opts.push(this.fb.group({ optionText: 'False', isCorrect: false }));
    } else {
      opts.push(this.fb.group({ optionText: '', isCorrect: true }));
      opts.push(this.fb.group({ optionText: '', isCorrect: false }));
      opts.push(this.fb.group({ optionText: '', isCorrect: false }));
      opts.push(this.fb.group({ optionText: '', isCorrect: false }));
    }
  }

  onSubmit(isPublished: boolean): void {
    if (this.quizForm.invalid) {
      this.errorMessage.set('Please fill out all required fields and options before submitting.');
      return;
    }

    this.isLoading.set(true);
    if (isPublished) {
      this.isPublishing.set(true);
    } else {
      this.isSavingDraft.set(true);
    }
    this.errorMessage.set(null);

    const values = this.quizForm.value;

    const requestData = {
      title: values.title!,
      description: values.description || undefined,
      category: values.category || 'General',
      difficulty: values.difficulty || 'Intermediate',
      isPublished: isPublished,
      passingScorePercentage: values.passingScorePercentage!,
      timeLimitMinutes: values.timeLimitMinutes || undefined,
      negativeMarkingPoints: values.negativeMarkingPoints || undefined,
      shuffleQuestions: values.shuffleQuestions || false,
      shuffleOptions: values.shuffleOptions || false,
      expiryDateUtc: values.expiryDateUtc ? new Date(values.expiryDateUtc).toISOString() : undefined,
      enableCertificate: values.enableCertificate || false,
      certificateForTopperOnly: values.certificateForTopperOnly || false,
      autoSubmit: values.autoSubmit || false,
      showResultsAfterSubmission: values.showResultsAfterSubmission ?? true,
      totalMarks: values.totalMarks || undefined,
      maxStudents: values.maxStudents ?? 15,
      questions: values.questions as any[]
    };

    this.quizService.createQuiz(requestData).subscribe({
      next: (quiz) => {
        this.isLoading.set(false);
        this.isPublishing.set(false);
        this.isSavingDraft.set(false);
        if (this.authService.userRole() === 3) {
          this.router.navigate(['/quiz', quiz.id]);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.isPublishing.set(false);
        this.isSavingDraft.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to save quiz. Please try again.');
      }
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { AuthService } from '../../../core/services/auth.service';
import { QuestionBankService, DomainTopicItem, SubTopicItem } from '../../../core/services/question-bank.service';
import { QuestionType, CreateQuizQuestionItem } from '../../../core/models/quiz.model';

export interface GovtExamTopic {
  title: string;
  recommendedQuestions: number;
  recommendedTimeMinutes: number;
  defaultNegativeMarking: number;
  difficulty: string;
}

export interface GovtExamCategory {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  topics: GovtExamTopic[];
}

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
          <span>✨ Academic & General AI</span>
        </button>

        <button
          type="button"
          [class.active]="creationMode() === 'govt'"
          (click)="setMode('govt')"
          class="tab-btn tab-btn-govt"
        >
          <span>🏛️ Govt & Competitive Exams Hub</span>
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
              <div class="label-with-count">
                <label>Number of Questions *</label>
                <span class="count-badge">{{ requestedQuestionCount }} Questions</span>
              </div>
              <div class="question-chips-row">
                @for (cnt of questionPresets; track cnt) {
                  <button
                    type="button"
                    class="chip-btn"
                    [class.active]="requestedQuestionCount === cnt"
                    (click)="setQuestionCount(cnt)"
                    [disabled]="isGenerating()"
                  >
                    {{ cnt }}
                  </button>
                }
              </div>
              <div class="stepper-input-row margin-top-xs">
                <button
                  type="button"
                  class="stepper-btn"
                  (click)="adjustQuestionCount(-1)"
                  [disabled]="requestedQuestionCount <= 1 || isGenerating()"
                  title="Decrease questions"
                >−</button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  [(ngModel)]="requestedQuestionCount"
                  [ngModelOptions]="{standalone: true}"
                  (input)="onManualQuestionCountChange($event)"
                  class="input-control stepper-input"
                  placeholder="Custom count (1-50)"
                  [disabled]="isGenerating()"
                />
                <button
                  type="button"
                  class="stepper-btn"
                  (click)="adjustQuestionCount(1)"
                  [disabled]="requestedQuestionCount >= 50 || isGenerating()"
                  title="Increase questions"
                >+</button>
                <span class="stepper-hint">Or type any number (1-50)</span>
              </div>
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

      <!-- Government & Competitive Exams Preparation Hub -->
      @if (creationMode() === 'govt') {
        <div class="saas-card govt-panel margin-bottom">
          <div class="panel-header">
            <div class="badge badge-govt mb-2">🏛️ EXAM PREPARATION ENGINE · UPSC, SSC, BANKING, RAILWAYS & DEFENCE</div>
            <h3>Government & Competitive Examination Hub</h3>
            <p class="panel-desc">
              Generate authentic previous-year pattern mock questions with strict time limits, automated negative marking, and detailed official answer explanations.
            </p>
          </div>

          <!-- Exam Stream Cards -->
          <div class="govt-streams-label">
            <span>Select Target Examination Stream:</span>
          </div>
          <div class="govt-exams-grid">
            @for (exam of govtExamCategories; track exam.id) {
              <div
                class="govt-exam-card"
                [class.active]="selectedGovtExamId === exam.id"
                (click)="selectGovtExam(exam)"
              >
                <div class="exam-icon">{{ exam.icon }}</div>
                <div class="exam-meta">
                  <h4 class="exam-name">{{ exam.name }}</h4>
                  <p class="exam-sub">{{ exam.tagline }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Active Exam Syllabus Modules -->
          @if (currentGovtExam()) {
            <div class="active-exam-module margin-top">
              <div class="module-label-row">
                <span class="module-label-title">Select {{ currentGovtExam()?.name }} Syllabus Topic:</span>
                <span class="module-tag">PYQ Pattern Ready</span>
              </div>
              <div class="topics-chips-cloud">
                @for (topic of currentGovtExam()?.topics || []; track topic.title) {
                  <button
                    type="button"
                    class="topic-chip"
                    [class.active]="selectedGovtTopicTitle === topic.title"
                    (click)="selectGovtTopic(topic)"
                    [disabled]="isGenerating()"
                  >
                    <span class="topic-dot"></span>
                    <span>{{ topic.title }}</span>
                  </button>
                }
              </div>

              <div class="form-group margin-top-sm">
                <label>Selected Syllabus Prompt / Custom Topic *</label>
                <input
                  type="text"
                  [(ngModel)]="customTopic"
                  [ngModelOptions]="{standalone: true}"
                  placeholder="e.g. Indian Polity - Articles on Fundamental Rights & Judiciary"
                  class="input-control"
                  [disabled]="isGenerating()"
                />
              </div>

              <!-- Govt Exam Specific Settings: Question Count with manual input, Negative Marking, Timer -->
              <div class="form-grid-2 margin-top-sm">
                <!-- Question Count -->
                <div class="form-group">
                  <div class="label-with-count">
                    <label>Number of Questions *</label>
                    <span class="count-badge">{{ requestedQuestionCount }} Questions</span>
                  </div>
                  <div class="question-chips-row">
                    @for (cnt of [10, 15, 20, 25, 30, 50]; track cnt) {
                      <button
                        type="button"
                        class="chip-btn"
                        [class.active]="requestedQuestionCount === cnt"
                        (click)="setQuestionCount(cnt)"
                        [disabled]="isGenerating()"
                      >
                        {{ cnt }}
                      </button>
                    }
                  </div>
                  <div class="stepper-input-row margin-top-xs">
                    <button type="button" class="stepper-btn" (click)="adjustQuestionCount(-1)" [disabled]="requestedQuestionCount <= 1 || isGenerating()">−</button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      [(ngModel)]="requestedQuestionCount"
                      [ngModelOptions]="{standalone: true}"
                      (input)="onManualQuestionCountChange($event)"
                      class="input-control stepper-input"
                      placeholder="Custom count (1-50)"
                      [disabled]="isGenerating()"
                    />
                    <button type="button" class="stepper-btn" (click)="adjustQuestionCount(1)" [disabled]="requestedQuestionCount >= 50 || isGenerating()">+</button>
                    <span class="stepper-hint">Or type any number (1-50)</span>
                  </div>
                </div>

                <!-- Exam Difficulty -->
                <div class="form-group">
                  <label>Difficulty Standard</label>
                  <select
                    [(ngModel)]="selectedDifficulty"
                    [ngModelOptions]="{standalone: true}"
                    class="input-control"
                    [disabled]="isGenerating()"
                  >
                    <option value="Hard">Hard (Strict Official Exam Level)</option>
                    <option value="Medium">Medium (Moderate Practice Test)</option>
                    <option value="Mixed">Mixed (Real Exam Balance 30-40-30)</option>
                  </select>
                </div>
              </div>

              <!-- Negative Marking Configuration -->
              <div class="form-group margin-top-sm">
                <label>
                  <span>Negative Marking Scheme</span>
                  <span class="optional-text">(Standard penalty per wrong attempt)</span>
                </label>
                <div class="negative-marking-pills">
                  <button
                    type="button"
                    class="neg-pill"
                    [class.active]="selectedNegativeMarking === 0"
                    (click)="setNegativeMarking(0)"
                  >
                    No Penalty (0)
                  </button>
                  <button
                    type="button"
                    class="neg-pill"
                    [class.active]="selectedNegativeMarking === 0.25"
                    (click)="setNegativeMarking(0.25)"
                  >
                    -0.25 (1/4th · Banking/Railways)
                  </button>
                  <button
                    type="button"
                    class="neg-pill"
                    [class.active]="selectedNegativeMarking === 0.33"
                    (click)="setNegativeMarking(0.33)"
                  >
                    -0.33 (1/3rd · UPSC/State PSC)
                  </button>
                  <button
                    type="button"
                    class="neg-pill"
                    [class.active]="selectedNegativeMarking === 0.5"
                    (click)="setNegativeMarking(0.5)"
                  >
                    -0.50 (1/2 · SSC CGL)
                  </button>
                  <button
                    type="button"
                    class="neg-pill"
                    [class.active]="selectedNegativeMarking === 1"
                    (click)="setNegativeMarking(1)"
                  >
                    -1.0 (Full · NEET/JEE)
                  </button>
                </div>
              </div>

              <!-- Hidden API Key Option -->
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
                  (click)="generateSmartQuestions(true)"
                  [disabled]="isGenerating()"
                  class="btn btn-govt-generate width-full"
                >
                  @if (isGenerating()) {
                    <span class="ai-spinner-row">
                      <svg class="ai-spinner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12" stroke-linecap="round"></circle>
                      </svg>
                      <span>Generating {{ requestedQuestionCount }} {{ currentGovtExam()?.name }} Questions with Groq AI...</span>
                    </span>
                  } @else {
                    <span>🏛️ Generate {{ currentGovtExam()?.name }} Mock Questions with AI</span>
                  }
                </button>
              </div>
            </div>
          }
        </div>

        @if (isGenerating()) {
          <div class="ai-generating-loader margin-bottom">
            <div class="loader-header">
              <div class="ai-pulsing-icon govt-pulsing">
                <span style="font-size: 1.5rem;">🏛️</span>
              </div>
              <div>
                <h4>Groq AI is crafting {{ currentGovtExam()?.name }} questions...</h4>
                <p>Generating {{ requestedQuestionCount }} exam-standard questions with answer keys and detailed explanations.</p>
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
              <label for="negativeMarkingPoints">
                <span>Negative Marking Penalty</span>
                <span class="optional-text">(Deducted per wrong answer)</span>
              </label>
              <div class="negative-marking-pills margin-bottom-xs">
                <button
                  type="button"
                  class="neg-pill"
                  [class.active]="quizForm.get('negativeMarkingPoints')?.value === 0 || !quizForm.get('negativeMarkingPoints')?.value"
                  (click)="setNegativeMarking(0)"
                >
                  0 (None)
                </button>
                <button
                  type="button"
                  class="neg-pill"
                  [class.active]="quizForm.get('negativeMarkingPoints')?.value === 0.25"
                  (click)="setNegativeMarking(0.25)"
                >
                  -0.25
                </button>
                <button
                  type="button"
                  class="neg-pill"
                  [class.active]="quizForm.get('negativeMarkingPoints')?.value === 0.33"
                  (click)="setNegativeMarking(0.33)"
                >
                  -0.33
                </button>
                <button
                  type="button"
                  class="neg-pill"
                  [class.active]="quizForm.get('negativeMarkingPoints')?.value === 0.5"
                  (click)="setNegativeMarking(0.5)"
                >
                  -0.50
                </button>
                <button
                  type="button"
                  class="neg-pill"
                  [class.active]="quizForm.get('negativeMarkingPoints')?.value === 1"
                  (click)="setNegativeMarking(1)"
                >
                  -1.0
                </button>
              </div>
              <input
                id="negativeMarkingPoints"
                type="number"
                step="0.01"
                min="0"
                formControlName="negativeMarkingPoints"
                class="input-control"
                placeholder="Or custom points (e.g. 0.25, 0.33, 0.5)"
              />
            </div>

            <div class="form-group">
              <label for="expiryDateUtc">Expiry Date / Deadline</label>
              <input id="expiryDateUtc" type="datetime-local" formControlName="expiryDateUtc" class="input-control" />
            </div>

            <div class="form-group">
              <label>
                👥 Max Students Allowed
                <span class="label-hint">Quiz closes after this many attempts. Admin can extend up to 2 times.</span>
              </label>
              <!-- Preset Chips -->
              <div class="student-preset-row">
                @for (preset of studentPresets; track preset) {
                  <button
                    type="button"
                    class="preset-chip"
                    [class.selected]="selectedStudentPreset() === preset"
                    (click)="selectStudentPreset(preset)"
                  >{{ preset }}</button>
                }
                <button
                  type="button"
                  class="preset-chip"
                  [class.selected]="selectedStudentPreset() === 0"
                  (click)="selectStudentPreset(0)"
                >✏️ Custom</button>
              </div>
              <!-- Manual input shown only when Custom is selected -->
              @if (selectedStudentPreset() === 0) {
                <input
                  id="maxStudents"
                  type="number"
                  formControlName="maxStudents"
                  placeholder="Enter any number (e.g. 200)"
                  min="1"
                  class="input-control margin-top-xs"
                />
              }
            </div>
          </div>

          <div class="form-grid-2 margin-top-sm" style="align-items: center; gap: 1.5rem; background: var(--bg-hover); padding: 1.25rem; border-radius: var(--radius-lg);">
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
                  <span>🚀 {{ authService.userRole() === 3 ? 'Save & Play Quiz' : 'Publish & Generate Link' }}</span>
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
            <div class="q-actions-group">
              <button type="button" (click)="addQuestion()" class="btn btn-outline btn-sm">➕ Add Question</button>
              <button type="button" (click)="addMultipleQuestions(5)" class="btn btn-outline btn-sm">➕ Add 5 Questions</button>
            </div>
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
              <span>🚀 {{ authService.userRole() === 3 ? 'Play Quiz' : 'Publish' }}</span>
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
      background: var(--bg-surface);
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
      &.tab-btn-govt.active {
        background: rgba(245, 158, 11, 0.15);
        color: #b45309 !important;
        border-color: #f59e0b;
      }
    }

    /* Generator Panel & Govt Exam Hub */
    .generator-panel {
      padding: 1.75rem;
      background: var(--bg-surface);
      border: 1px solid var(--color-ai-border);
      border-top: 4px solid var(--color-ai-purple);
      border-radius: 0.75rem;
      .panel-desc { font-size: 0.875rem; color: var(--text-secondary) !important; margin: 0.25rem 0 1.25rem 0; }
    }

    .govt-panel {
      padding: 1.75rem;
      background: var(--bg-surface);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-top: 4px solid #b45309;
      border-radius: 0.75rem;
      box-shadow: 0 4px 20px rgba(245, 158, 11, 0.08);
      .panel-desc { font-size: 0.875rem; color: var(--text-secondary) !important; margin: 0.25rem 0 1.25rem 0; }
    }

    .badge-govt {
      background: rgba(245, 158, 11, 0.12);
      color: #b45309 !important;
      border: 1px solid rgba(245, 158, 11, 0.3);
      font-weight: 800;
      font-size: 0.72rem;
      letter-spacing: 0.05em;
    }

    /* Question count chips & stepper */
    .label-with-count {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.35rem;
      label { margin: 0; font-weight: 700; color: var(--text-primary) !important; font-size: 0.85rem; }
    }
    .count-badge {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--color-primary-600);
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    .question-chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.5rem;
    }
    .chip-btn {
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      border: 1.5px solid var(--border-hairline);
      background: var(--bg-surface);
      color: var(--text-body);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover {
        border-color: var(--color-primary-600);
        color: var(--color-primary-600);
      }
      &.active {
        background: var(--color-primary-600);
        border-color: var(--color-primary-600);
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
      }
    }

    .stepper-input-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .stepper-btn {
      width: 34px;
      height: 34px;
      border-radius: 6px;
      border: 1px solid var(--border-strong);
      background: var(--bg-hover);
      font-size: 1.15rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-heading);
      transition: all 0.15s ease;
      &:hover:not(:disabled) {
        background: var(--color-primary-50);
        color: var(--color-primary-600);
        border-color: var(--color-primary-300);
      }
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
    .stepper-input {
      width: 120px !important;
      text-align: center;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .stepper-hint {
      font-size: 0.75rem;
      color: var(--text-muted) !important;
    }

    /* Govt Exam Streams & Topic Cards */
    .govt-streams-label {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-heading);
      margin: 1rem 0 0.5rem 0;
    }
    .govt-exams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .govt-exam-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1.5px solid var(--border-hairline);
      background: var(--bg-surface);
      cursor: pointer;
      transition: all 0.2s ease;
      &:hover {
        border-color: #f59e0b;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.12);
      }
      &.active {
        border-color: #b45309;
        background: rgba(245, 158, 11, 0.08);
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.18);
      }
    }
    .exam-icon { font-size: 1.5rem; flex-shrink: 0; }
    .exam-meta { display: flex; flex-direction: column; }
    .exam-name { font-size: 0.825rem; font-weight: 800; color: var(--text-heading) !important; margin: 0; }
    .exam-sub { font-size: 0.7rem; color: var(--text-muted) !important; margin: 0.15rem 0 0 0; line-height: 1.3; }

    .active-exam-module {
      border-top: 1px dashed var(--border-hairline);
      padding-top: 1.25rem;
    }
    .module-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .module-label-title {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-heading);
    }
    .module-tag {
      font-size: 0.7rem;
      font-weight: 800;
      color: #b45309;
      background: rgba(245, 158, 11, 0.15);
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .topics-chips-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .topic-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      border-radius: 9999px;
      border: 1px solid var(--border-hairline);
      background: var(--bg-surface);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-body);
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover {
        border-color: #b45309;
        color: #b45309;
      }
      &.active {
        background: #b45309;
        border-color: #b45309;
        color: #ffffff;
        .topic-dot { background: #ffffff; }
      }
    }
    .topic-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #b45309;
      flex-shrink: 0;
    }

    /* Negative Marking Pills */
    .negative-marking-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.35rem;
    }
    .margin-bottom-xs { margin-bottom: 0.4rem; }
    .neg-pill {
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      border: 1px solid var(--border-hairline);
      background: var(--bg-surface);
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-body);
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover {
        border-color: var(--color-danger);
        color: var(--color-danger);
      }
      &.active {
        background: var(--color-danger);
        border-color: var(--color-danger);
        color: #ffffff;
      }
    }

    .btn-govt-generate {
      background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
      color: #ffffff !important;
      font-weight: 800;
      padding: 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(180, 83, 9, 0.35);
      transition: all 0.2s ease;
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(180, 83, 9, 0.45);
      }
    }
    .govt-pulsing {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
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

    /* Student Preset Chips */
    .student-preset-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .preset-chip {
      padding: 0.45rem 1.1rem;
      border-radius: 9999px;
      border: 1.5px solid var(--border-strong);
      background: var(--bg-surface);
      color: var(--text-body);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover {
        border-color: var(--color-primary-600);
        color: var(--color-primary-600);
        background: var(--color-primary-50);
      }
      &.selected {
        background: var(--color-primary-600);
        border-color: var(--color-primary-600);
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
      }
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
      background: var(--bg-surface);
      border: 1.5px solid var(--color-ai-border);
      border-radius: var(--radius-xl);
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
      border-radius: var(--radius-lg);
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
      border-radius: var(--radius-lg);
      padding: 1.0rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .shimmer-line {
      height: 12px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border-hairline) 50%, var(--bg-hover) 75%);
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
    .section-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem; }
    .q-actions-group { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }

    .questions-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .question-card { background: var(--bg-app); border: 1px solid var(--border-hairline); padding: 1.5rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); }
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
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    }

    .alert-danger {
      background: var(--color-danger-bg);
      border: 1px solid var(--color-danger-border);
      color: var(--color-danger) !important;
      padding: 1.0rem;
      border-radius: var(--radius-md);
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
  readonly creationMode = signal<'smart' | 'govt' | 'manual'>('smart');
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

  // Question presets and stepper controls
  readonly questionPresets = [5, 10, 15, 20, 25, 30, 50];

  // Government & Competitive Examination Data
  readonly govtExamCategories: GovtExamCategory[] = [
    {
      id: 'upsc',
      name: 'UPSC Civil Services (IAS/IPS)',
      icon: '🏛️',
      tagline: 'Union Public Service Commission · Prelims GS 1 & CSAT',
      topics: [
        { title: 'UPSC Indian Polity & Constitution (Articles, Parliament, Judiciary)', recommendedQuestions: 25, recommendedTimeMinutes: 30, defaultNegativeMarking: 0.33, difficulty: 'Hard' },
        { title: 'UPSC Modern Indian History & National Movement (1857-1947)', recommendedQuestions: 20, recommendedTimeMinutes: 25, defaultNegativeMarking: 0.33, difficulty: 'Hard' },
        { title: 'UPSC Indian Economy, Fiscal Policy & Banking System', recommendedQuestions: 20, recommendedTimeMinutes: 25, defaultNegativeMarking: 0.33, difficulty: 'Hard' },
        { title: 'UPSC Physical & Indian Geography, Climate & Rivers', recommendedQuestions: 20, recommendedTimeMinutes: 25, defaultNegativeMarking: 0.33, difficulty: 'Hard' },
        { title: 'UPSC Environment, Ecology, Biodiversity & Climate Treaties', recommendedQuestions: 20, recommendedTimeMinutes: 25, defaultNegativeMarking: 0.33, difficulty: 'Hard' },
        { title: 'UPSC CSAT (Logical Reasoning, Data Sufficiency & Math)', recommendedQuestions: 20, recommendedTimeMinutes: 30, defaultNegativeMarking: 0.33, difficulty: 'Hard' }
      ]
    },
    {
      id: 'ssc',
      name: 'SSC CGL & CHSL',
      icon: '📋',
      tagline: 'Staff Selection Commission · Tier 1 & Tier 2 CBT',
      topics: [
        { title: 'SSC Quantitative Aptitude (Number Systems, Algebra, Geometry, Trigonometry)', recommendedQuestions: 25, recommendedTimeMinutes: 25, defaultNegativeMarking: 0.5, difficulty: 'Hard' },
        { title: 'SSC General Intelligence & Logical Reasoning (Puzzles, Syllogisms, Analogies)', recommendedQuestions: 25, recommendedTimeMinutes: 20, defaultNegativeMarking: 0.5, difficulty: 'Medium' },
        { title: 'SSC General Awareness (Static GK, Modern History, Science, Polity)', recommendedQuestions: 25, recommendedTimeMinutes: 15, defaultNegativeMarking: 0.5, difficulty: 'Medium' },
        { title: 'SSC English Language & Comprehension (Error Spotting, Idioms, Vocab)', recommendedQuestions: 25, recommendedTimeMinutes: 15, defaultNegativeMarking: 0.5, difficulty: 'Medium' }
      ]
    },
    {
      id: 'banking',
      name: 'Banking & Insurance (IBPS/SBI)',
      icon: '🏦',
      tagline: 'SBI PO, IBPS PO, RBI Grade B · Prelims & Mains',
      topics: [
        { title: 'Banking & Financial Awareness (RBI Policies, Capital Markets, Inflation)', recommendedQuestions: 20, recommendedTimeMinutes: 15, defaultNegativeMarking: 0.25, difficulty: 'Hard' },
        { title: 'Banking Data Interpretation (Pie, Bar, Caselet DI & Arithmetic)', recommendedQuestions: 25, recommendedTimeMinutes: 30, defaultNegativeMarking: 0.25, difficulty: 'Hard' },
        { title: 'Banking Reasoning Ability (High-Level Puzzles & Seating Arrangements)', recommendedQuestions: 25, recommendedTimeMinutes: 25, defaultNegativeMarking: 0.25, difficulty: 'Hard' },
        { title: 'Banking English Language (Reading Comprehension, Cloze Test, Para Jumbles)', recommendedQuestions: 20, recommendedTimeMinutes: 20, defaultNegativeMarking: 0.25, difficulty: 'Medium' }
      ]
    },
    {
      id: 'railways',
      name: 'Railways (RRB NTPC & Group D)',
      icon: '🚆',
      tagline: 'Railway Recruitment Board · Stage 1 & 2 CBT',
      topics: [
        { title: 'Railways General Science (Physics, Chemistry & Biology Class 9-10 NCERT)', recommendedQuestions: 30, recommendedTimeMinutes: 25, defaultNegativeMarking: 0.33, difficulty: 'Medium' },
        { title: 'Railways Mathematics (Arithmetic, Percentages, Time & Work, Speed)', recommendedQuestions: 25, recommendedTimeMinutes: 30, defaultNegativeMarking: 0.33, difficulty: 'Medium' },
        { title: 'Railways General Knowledge & National Current Affairs', recommendedQuestions: 25, recommendedTimeMinutes: 20, defaultNegativeMarking: 0.33, difficulty: 'Medium' }
      ]
    },
    {
      id: 'defence',
      name: 'Defence (NDA, CDS, AFCAT)',
      icon: '🛡️',
      tagline: 'Armed Forces & Police Sub-Inspector Examinations',
      topics: [
        { title: 'Defence General Ability Test (GAT - History, Geography, General Science)', recommendedQuestions: 30, recommendedTimeMinutes: 35, defaultNegativeMarking: 0.33, difficulty: 'Hard' },
        { title: 'Defence Elementary Mathematics & Trigonometry', recommendedQuestions: 25, recommendedTimeMinutes: 35, defaultNegativeMarking: 0.33, difficulty: 'Hard' },
        { title: 'Defence English Vocabulary, Comprehension & Grammar', recommendedQuestions: 25, recommendedTimeMinutes: 20, defaultNegativeMarking: 0.33, difficulty: 'Medium' }
      ]
    },
    {
      id: 'teaching',
      name: 'Teaching & State PSC (CTET/PCS)',
      icon: '📚',
      tagline: 'Central Teacher Eligibility Test & State Civil Services',
      topics: [
        { title: 'CTET Child Development & Educational Pedagogy (CDP)', recommendedQuestions: 30, recommendedTimeMinutes: 30, defaultNegativeMarking: 0, difficulty: 'Medium' },
        { title: 'State PSC General Studies & Administrative History', recommendedQuestions: 25, recommendedTimeMinutes: 25, defaultNegativeMarking: 0.33, difficulty: 'Hard' },
        { title: 'CTET Environmental Studies (EVS) & Content Pedagogy', recommendedQuestions: 25, recommendedTimeMinutes: 25, defaultNegativeMarking: 0, difficulty: 'Medium' }
      ]
    },
    {
      id: 'entrance',
      name: 'National Entrance (NEET/JEE/CUET)',
      icon: '🔬',
      tagline: 'Pre-Medical & Pre-Engineering Competitive Entrance',
      topics: [
        { title: 'NEET Biology (Genetics, Cell Biology, Human Physiology & Ecology)', recommendedQuestions: 30, recommendedTimeMinutes: 30, defaultNegativeMarking: 1.0, difficulty: 'Hard' },
        { title: 'JEE Physics (Mechanics, Newton Laws, Thermodynamics, Optics)', recommendedQuestions: 25, recommendedTimeMinutes: 40, defaultNegativeMarking: 1.0, difficulty: 'Hard' },
        { title: 'Chemistry (Organic Reaction Mechanisms, Chemical Bonding, Equilibrium)', recommendedQuestions: 25, recommendedTimeMinutes: 30, defaultNegativeMarking: 1.0, difficulty: 'Hard' }
      ]
    }
  ];

  selectedGovtExamId = 'upsc';
  selectedGovtTopicTitle = '';
  selectedNegativeMarking = 0;

  currentGovtExam(): GovtExamCategory | undefined {
    return this.govtExamCategories.find(e => e.id === this.selectedGovtExamId);
  }

  selectGovtExam(exam: GovtExamCategory): void {
    this.selectedGovtExamId = exam.id;
    if (exam.topics.length > 0) {
      this.selectGovtTopic(exam.topics[0]);
    }
  }

  selectGovtTopic(topic: GovtExamTopic): void {
    this.selectedGovtTopicTitle = topic.title;
    this.customTopic = topic.title;
    this.requestedQuestionCount = topic.recommendedQuestions;
    this.selectedDifficulty = topic.difficulty;
    this.selectedNegativeMarking = topic.defaultNegativeMarking;

    const exam = this.currentGovtExam();
    this.quizForm.patchValue({
      title: `${exam?.name || 'Competitive Exam'} Mock Test: ${topic.title.split('(')[0].trim()}`,
      category: 'Government & Competitive Exam',
      difficulty: topic.difficulty,
      timeLimitMinutes: topic.recommendedTimeMinutes,
      negativeMarkingPoints: topic.defaultNegativeMarking,
      autoSubmit: true,
      instructions: `Official Exam Pattern: This mock test has ${topic.recommendedQuestions} questions with a strict ${topic.recommendedTimeMinutes}-minute timer. Negative marking of ${topic.defaultNegativeMarking} mark(s) applies for every wrong answer. Review your answers carefully before submitting.`
    });
  }

  setQuestionCount(cnt: number): void {
    this.requestedQuestionCount = Math.min(50, Math.max(1, cnt));
  }

  adjustQuestionCount(delta: number): void {
    const next = (this.requestedQuestionCount || 10) + delta;
    this.requestedQuestionCount = Math.min(50, Math.max(1, next));
  }

  onManualQuestionCountChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val > 0) {
      this.requestedQuestionCount = Math.min(50, Math.max(1, val));
    } else {
      this.requestedQuestionCount = 10;
    }
  }

  setNegativeMarking(val: number): void {
    this.selectedNegativeMarking = val;
    this.quizForm.patchValue({ negativeMarkingPoints: val });
  }

  // Max students preset chips
  readonly studentPresets = [15, 20, 30, 50, 100];
  readonly selectedStudentPreset = signal<number>(15);

  selectStudentPreset(value: number): void {
    this.selectedStudentPreset.set(value);
    if (value > 0) {
      this.quizForm.patchValue({ maxStudents: value });
    }
  }

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
      } else if (params['mode'] === 'govt') {
        this.setMode('govt');
        if (params['exam']) {
          const matchExam = this.govtExamCategories.find(e => e.id === params['exam']);
          if (matchExam) {
            this.selectGovtExam(matchExam);
          }
        }
      }
      if (params['topic']) {
        this.customTopic = params['topic'];
        this.quizForm.patchValue({
          title: `${params['topic']} Assessment`,
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

  setMode(mode: 'manual' | 'smart' | 'govt'): void {
    this.creationMode.set(mode);
    this.errorMessage.set(null);
    if (mode === 'govt' && !this.selectedGovtTopicTitle) {
      const defaultExam = this.govtExamCategories[0];
      this.selectGovtExam(defaultExam);
    }
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

  generateSmartQuestions(isGovtMode: boolean = false): void {
    let topicToUse = this.customTopic.trim();
    if (!topicToUse) {
      if (isGovtMode && this.currentGovtExam()) {
        topicToUse = `${this.currentGovtExam()?.name} - General Knowledge & Aptitude`;
      } else {
        topicToUse = (this.domainTopics().find(d => d.id === this.selectedDomainId)?.name ?? 'General Knowledge');
      }
    }

    if (!topicToUse) {
      this.errorMessage.set('Please enter a topic prompt or select an exam topic.');
      return;
    }

    const questionCount = Math.min(50, Math.max(1, Number(this.requestedQuestionCount) || 10));

    this.isGenerating.set(true);
    this.errorMessage.set(null);

    this.questionBankService.generateQuestions({
      domainTopicId: this.selectedDomainId || undefined,
      subTopicId: this.selectedSubTopicId || undefined,
      customTopic: topicToUse,
      questionCount: questionCount,
      difficulty: this.selectedDifficulty,
      apiKey: this.customApiKey ? this.customApiKey.trim() : undefined
    }).subscribe({
      next: (generatedQuestions) => {
        this.isGenerating.set(false);
        if (generatedQuestions && generatedQuestions.length > 0) {
          if (!this.quizForm.value.title) {
            this.quizForm.patchValue({
              title: `${topicToUse} Mock Assessment`,
              category: isGovtMode ? 'Government & Competitive Exam' : topicToUse
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

  addMultipleQuestions(count: number): void {
    const toAdd = Math.min(20, Math.max(1, count));
    for (let i = 0; i < toAdd; i++) {
      if (this.questionsArray.length < 50) {
        this.addQuestion();
      }
    }
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

    // Force students to only save as drafts (never published/shareable)
    const finalIsPublished = this.authService.userRole() === 3 ? false : isPublished;

    this.isLoading.set(true);
    if (finalIsPublished) {
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
      isPublished: finalIsPublished,
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
          // Students go straight to playing the quiz
          this.router.navigate(['/quiz', quiz.id]);
        } else {
          if (finalIsPublished) {
            this.router.navigate(['/quiz', quiz.id, 'success']);
          } else {
            this.router.navigate(['/dashboard']);
          }
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

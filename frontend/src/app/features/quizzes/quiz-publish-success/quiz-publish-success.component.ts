import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { Quiz } from '../../../core/models/quiz.model';

@Component({
  selector: 'app-quiz-publish-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="success-page-wrapper">
      <div class="success-card saas-card">
        @if (isLoading()) {
          <div class="spinner-container">
            <div class="ai-spinner-svg"></div>
            <p>Loading your quiz details...</p>
          </div>
        } @else if (quiz()) {
          <div class="success-header">
            <div class="success-icon">🎉</div>
            <h2>Quiz Published Successfully!</h2>
            <p class="sub-text">Your assessment "<strong>{{ quiz()?.title }}</strong>" is now live and ready to be shared with your students.</p>
          </div>

          <div class="share-section margin-top">
            <h3>📋 Share with Students</h3>
            <p class="share-desc">Send this link to your students to start the assessment. They can take it on any device.</p>
            
            <div class="link-box">
              <input type="text" [value]="quizUrl()" readonly class="input-control share-input" #linkInput />
              <button (click)="copyLink(linkInput)" class="btn btn-primary btn-copy">
                {{ linkCopied() ? '✓ Copied!' : 'Copy Link' }}
              </button>
            </div>
            
            <div class="qr-section margin-top">
              <h4>Or share via QR Code</h4>
              <div class="qr-placeholder" title="QR Code for Quiz">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"></path>
                  <path d="M9 3v6M15 3v6M3 9h6M15 9h6M3 15v6M9 15v6M3 21h6"></path>
                </svg>
                <p>Scan to Start</p>
              </div>
            </div>
          </div>

          <div class="actions-section margin-top">
            <h3>Test Your Assessment</h3>
            <p class="share-desc">You can start the quiz yourself to check the questions' hardness and flow.</p>
            
            <div class="action-btns">
              <a [routerLink]="['/quiz', quiz()?.id]" class="btn btn-ai btn-lg width-full" style="justify-content: center;">
                ▶️ Start Quiz Now
              </a>
              <a routerLink="/dashboard" class="btn btn-outline btn-lg width-full" style="justify-content: center;">
                Go back to Dashboard
              </a>
            </div>
          </div>
        } @else {
          <div class="alert alert-error">
            <span>⚠️ Could not load quiz details.</span>
            <a routerLink="/dashboard" class="btn btn-outline btn-sm margin-top">Go back to Dashboard</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .success-page-wrapper {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-app);
      padding: 2rem 1.5rem;
    }
    .success-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      padding: 2.5rem;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      text-align: center;
    }
    .success-header {
      margin-bottom: 2rem;
    }
    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes pop {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }
    h2 { color: var(--color-success-text) !important; font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.025em; }
    .sub-text { color: var(--text-secondary) !important; font-size: 1rem; font-weight: 400; line-height: 1.5; }
    
    .margin-top { margin-top: 1.5rem; }
    
    .share-section, .actions-section {
      background: var(--bg-hover);
      padding: 1.5rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-hairline);
      text-align: left;
    }
    .share-section h3, .actions-section h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary) !important;
      margin: 0 0 0.25rem 0;
    }
    .share-desc {
      font-size: 0.875rem;
      color: var(--text-muted) !important;
      margin: 0 0 1rem 0;
    }
    
    .link-box {
      display: flex;
      gap: 0.5rem;
    }
    .share-input {
      flex: 1;
      font-family: monospace;
      font-size: 0.9rem;
      background: #ffffff;
    }
    .btn-copy {
      min-width: 120px;
    }
    
    .qr-section {
      text-align: center;
      padding-top: 1rem;
      border-top: 1px dashed var(--border-hairline);
    }
    .qr-section h4 {
      font-size: 0.95rem;
      color: var(--text-secondary) !important;
      margin-bottom: 0.75rem;
    }
    .qr-placeholder {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      background: #ffffff;
      border: 1px solid var(--border-hairline);
      border-radius: 0.5rem;
      color: var(--text-muted);
    }
    .qr-placeholder svg {
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    
    .action-btns {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .width-full { width: 100%; justify-content: center; }
    .btn-lg { padding: 0.85rem 1.5rem; font-size: 1rem; }
    
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem 0;
    }
    .ai-spinner-svg {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-primary-50);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
export class QuizPublishSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(QuizService);
  
  readonly quiz = signal<Quiz | null>(null);
  readonly isLoading = signal(true);
  readonly linkCopied = signal(false);

  ngOnInit(): void {
    const quizId = this.route.snapshot.paramMap.get('id');
    if (quizId) {
      this.quizService.getQuizById(quizId).subscribe({
        next: (q) => {
          this.quiz.set(q);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  quizUrl(): string {
    const q = this.quiz();
    if (!q) return '';
    const shortId = q.shortId || q.id;
    return `${window.location.origin}/q/${shortId}`;
  }

  copyLink(inputElement: HTMLInputElement): void {
    inputElement.select();
    document.execCommand('copy');
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 3000);
  }
}

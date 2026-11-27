import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="auth-page-wrapper">
      <div class="auth-top-nav">
        <a routerLink="/" class="back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back to Home</span>
        </a>
      </div>
      <div class="auth-card-clean saas-card">
        <div class="auth-brand-header">
          <a routerLink="/" class="brand-link" title="Quizzy AI Home">
            <div class="brand-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
          </a>
          <h2>Reset Your Password</h2>
          <p class="sub-heading">Automated password recovery is not available for this account.</p>
        </div>

        <div class="alert-error" role="status">
          Please contact your organization administrator to reset your password.
        </div>

        <div class="auth-card-footer">
          <p>Remembered password? <a routerLink="/auth/login">Back to Sign In</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page-wrapper {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-app);
      padding: 2.5rem 1.5rem;
    }
    .auth-top-nav {
      width: 100%;
      max-width: 420px;
      margin-bottom: 1rem;
      display: flex;
      justify-content: flex-start;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: all 0.2s ease;
      svg { stroke: var(--text-muted); transition: transform 0.2s ease; }
      &:hover {
        color: var(--color-primary);
        border-color: var(--color-primary-200);
        transform: translateX(-3px);
        svg { stroke: var(--color-primary); }
      }
    }
    .brand-link {
      display: inline-block;
      text-decoration: none;
      transition: transform 0.2s ease;
      &:hover { transform: scale(1.05); }
    }
    .auth-card-clean {
      background: var(--bg-card);
      border: 1px solid var(--border-hairline);
      border-radius: 0.75rem;
      padding: 2.5rem 2.25rem;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-sm);
    }
    .auth-brand-header {
      text-align: center;
      margin-bottom: 1.75rem;
      .brand-logo-icon {
        width: 48px;
        height: 48px;
        border-radius: 0.75rem;
        background: var(--color-primary);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.0rem auto;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
      }
      h2 {
        color: var(--text-primary) !important;
        font-size: 1.65rem;
        font-weight: 800;
        margin-bottom: 0.35rem;
        letter-spacing: -0.025em;
      }
      .sub-heading {
        color: var(--text-secondary) !important;
        font-size: 0.875rem;
        font-weight: 400;
      }
    }
    .alert-success {
      background: var(--color-success-bg);
      border: 1px solid var(--color-success-border);
      color: var(--color-success) !important;
      padding: 0.85rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.5;
      span { color: var(--color-success) !important; }
    }
    .alert-error {
      color: var(--color-warning) !important;
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning-border);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .auth-form-layout {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      label {
        color: var(--text-primary) !important;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .field-error {
        color: var(--color-danger) !important;
        font-size: 0.75rem;
        font-weight: 600;
      }
    }
    .btn-submit-primary {
      width: 100% !important;
      margin-top: 0.5rem !important;
      padding: 0.75rem !important;
      font-size: 0.95rem !important;
      font-weight: 700 !important;
    }
    .auth-card-footer {
      text-align: center;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-hairline);
      p {
        color: var(--text-secondary) !important;
        font-size: 0.875rem;
        font-weight: 500;
        a {
          color: var(--color-primary) !important;
          text-decoration: none;
          font-weight: 700;
          &:hover { text-decoration: underline; }
        }
      }
    }
  `]
})
export class ForgotPasswordComponent {}

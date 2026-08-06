import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page-wrapper">
      <div class="auth-card-clean saas-card">
        <div class="auth-brand-header">
          <div class="brand-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <h2>Reset Your Password</h2>
          <p class="sub-heading">Enter your registered email address to receive password reset instructions</p>
        </div>

        @if (isSuccess()) {
          <div class="alert alert-success">
            <span>✅ Password reset instructions sent! Check your inbox to complete reset.</span>
          </div>
        } @else {
          <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form-layout">
            <div class="form-field">
              <label for="email">Registered Email Address</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="you@example.com"
                class="input-control"
                [class.is-invalid]="emailControl?.invalid && emailControl?.touched"
              />
              @if (emailControl?.invalid && emailControl?.touched) {
                <span class="field-error">Please enter a valid email address.</span>
              }
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-submit-primary"
              [disabled]="resetForm.invalid || isLoading()"
            >
              @if (isLoading()) {
                <span>Sending Instructions...</span>
              } @else {
                <span>Send Reset Link</span>
              }
            </button>
          </form>
        }

        <div class="auth-card-footer">
          <p>Remembered password? <a routerLink="/auth/login">Back to Sign In</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-app);
      padding: 2.5rem 1.5rem;
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
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal(false);
  readonly isSuccess = signal(false);

  readonly resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get emailControl() { return this.resetForm.get('email'); }

  onSubmit(): void {
    if (this.resetForm.invalid) return;
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.isSuccess.set(true);
    }, 1200);
  }
}

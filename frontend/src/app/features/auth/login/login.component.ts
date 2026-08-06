import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card saas-card">
        <div class="auth-brand">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <h2>Sign in to QuizPulse</h2>
          <p class="sub-heading">Enter your credentials to access your quiz dashboard</p>
        </div>

        @if (errorMessage()) {
          <div class="alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-field">
            <label for="tenantIdentifier">Organization ID <span class="optional-tag">optional</span></label>
            <input
              id="tenantIdentifier"
              type="text"
              formControlName="tenantIdentifier"
              placeholder="e.g. acme123"
              class="input-control"
            />
          </div>

          <div class="form-field">
            <label for="email">Email Address</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="you&#64;example.com"
              class="input-control"
              [class.is-invalid]="emailControl?.invalid && emailControl?.touched"
            />
            @if (emailControl?.invalid && emailControl?.touched) {
              <span class="field-error">Please enter a valid email address.</span>
            }
          </div>

          <div class="form-field">
            <div class="label-row">
              <label for="password">Password</label>
            </div>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              class="input-control"
              [class.is-invalid]="passwordControl?.invalid && passwordControl?.touched"
            />
            @if (passwordControl?.invalid && passwordControl?.touched) {
              <span class="field-error">Password is required.</span>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-submit"
            [disabled]="loginForm.invalid || isLoading()"
          >
            @if (isLoading()) {
              <span>Signing in...</span>
            } @else {
              <span>Sign In</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/auth/register">Create one free</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-app);
      padding: 2.5rem 1.5rem;
    }
    .auth-card {
      background: var(--bg-card);
      border: 1px solid var(--border-hairline);
      border-radius: 0.75rem;
      padding: 2.5rem 2.25rem;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-sm);
    }
    .auth-brand {
      text-align: center;
      margin-bottom: 1.75rem;
      .brand-icon {
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
        font-size: 1.6rem;
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
    .alert-error {
      background: var(--color-danger-bg);
      border: 1px solid var(--color-danger-border);
      color: var(--color-danger) !important;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.25rem;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      svg { stroke: var(--color-danger); flex-shrink: 0; }
      span { color: var(--color-danger) !important; }
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      .label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      label {
        color: var(--text-primary) !important;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .optional-tag {
        font-size: 0.7rem;
        font-weight: 500;
        color: var(--text-muted) !important;
        text-transform: uppercase;
        margin-left: 0.4rem;
      }
      .forgot-link {
        color: var(--color-primary) !important;
        font-size: 0.8rem;
        font-weight: 700;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
      .field-error {
        color: var(--color-danger) !important;
        font-size: 0.75rem;
        font-weight: 600;
      }
    }
    .btn-submit {
      width: 100% !important;
      margin-top: 0.5rem !important;
      padding: 0.75rem !important;
      font-size: 0.95rem !important;
      font-weight: 700 !important;
    }
    .auth-footer {
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
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.fb.group({
    tenantIdentifier: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  get emailControl() { return this.loginForm.get('email'); }
  get passwordControl() { return this.loginForm.get('password'); }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const values = this.loginForm.value;

    this.authService.login({
      email: values.email!,
      password: values.password!,
      tenantIdentifier: values.tenantIdentifier || undefined
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Login failed. Please check your credentials.');
      }
    });
  }
}

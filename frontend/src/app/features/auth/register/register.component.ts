import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/auth.model';

export enum RegistrationType {
  Individual = 'individual',
  Organization = 'organization'
}

@Component({
  selector: 'app-register',
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
          <h2>Create Your QuizPulse Account</h2>
          <p class="sub-text">Choose your account type and setup your assessment workspace</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-error">
            <span>⚠️ {{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form-layout">
          <!-- Step 1: Account Category (Individual vs Organization) -->
          <div class="form-field">
            <label>1. Who are you?</label>
            <div class="account-type-grid">
              <label
                class="type-card"
                [class.selected]="accountType() === RegistrationType.Individual"
                (click)="setAccountType(RegistrationType.Individual)"
              >
                <span class="type-icon">👤</span>
                <div class="type-meta">
                  <span class="type-title">Individual / Teacher</span>
                  <span class="type-desc">Create quizzes & assessments for my students</span>
                </div>
              </label>

              <label
                class="type-card"
                [class.selected]="accountType() === RegistrationType.Organization"
                (click)="setAccountType(RegistrationType.Organization)"
              >
                <span class="type-icon">🏢</span>
                <div class="type-meta">
                  <span class="type-title">Organization / School</span>
                  <span class="type-desc">Setup multi-user institutional portal</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 2: Role Selection -->
          @if (accountType() === RegistrationType.Individual) {
            <div class="form-field">
              <label>2. What is your primary goal?</label>
              <div class="role-selector-pills">
                <label
                  class="pill-option"
                  [class.active]="registerForm.get('role')?.value === UserRole.Instructor"
                >
                  <input type="radio" formControlName="role" [value]="UserRole.Instructor" class="hidden-radio" />
                  <span>👨‍🏫 Educator / Creator (Create AI Quizzes)</span>
                </label>
                <label
                  class="pill-option"
                  [class.active]="registerForm.get('role')?.value === UserRole.Student"
                >
                  <input type="radio" formControlName="role" [value]="UserRole.Student" class="hidden-radio" />
                  <span>🎓 Student / Learner (Take Assessments & Learn)</span>
                </label>
              </div>
            </div>
          } @else {
            <div class="form-field">
              <label>2. Organization Role</label>
              <div class="role-selector-pills">
                <label class="pill-option active">
                  <input type="radio" formControlName="role" [value]="UserRole.TenantAdmin" class="hidden-radio" />
                  <span>🔑 Tenant Administrator (Full Portal Management)</span>
                </label>
              </div>
            </div>
          }

          <!-- Step 3: Personal Details -->
          <div class="form-row">
            <div class="form-field">
              <label for="firstName">First Name</label>
              <input id="firstName" type="text" formControlName="firstName" class="input-control" placeholder="John" />
              @if (registerForm.get('firstName')?.touched && registerForm.get('firstName')?.invalid) {
                <span class="field-error">First name is required.</span>
              }
            </div>

            <div class="form-field">
              <label for="lastName">Last Name</label>
              <input id="lastName" type="text" formControlName="lastName" class="input-control" placeholder="Doe" />
              @if (registerForm.get('lastName')?.touched && registerForm.get('lastName')?.invalid) {
                <span class="field-error">Last name is required.</span>
              }
            </div>
          </div>

          <!-- Organization Fields (Only shown for Organization mode) -->
          @if (accountType() === RegistrationType.Organization) {
            <div class="form-field">
              <label for="tenantName">Organization / Institution Name</label>
              <input id="tenantName" type="text" formControlName="tenantName" class="input-control" placeholder="Acme Academy" />
              @if (registerForm.get('tenantName')?.touched && registerForm.get('tenantName')?.invalid) {
                <span class="field-error">Organization name is required.</span>
              }
            </div>

            <div class="form-field">
              <label for="tenantIdentifier">Organization Identifier (URL Slug)</label>
              <input
                id="tenantIdentifier"
                type="text"
                formControlName="tenantIdentifier"
                class="input-control"
                placeholder="acme123"
              />
              <span class="field-hint">Only lowercase letters, numbers, and hyphens allowed (e.g. <strong>acme123</strong>).</span>
              @if (registerForm.get('tenantIdentifier')?.touched && registerForm.get('tenantIdentifier')?.invalid) {
                <span class="field-error">Identifier must contain only lowercase letters, numbers, and hyphens.</span>
              }
            </div>
          }

          <div class="form-field">
            <label for="email">Work / Personal Email</label>
            <input id="email" type="email" formControlName="email" class="input-control" placeholder="john@example.com" />
            @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
              <span class="field-error">Valid email address is required.</span>
            }
          </div>

          <div class="form-field">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" class="input-control" placeholder="Minimum 8 characters" />
            @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
              <span class="field-error">Password must be at least 8 characters.</span>
            }
          </div>

          <button type="submit" class="btn btn-primary btn-submit-primary" [disabled]="registerForm.invalid || isLoading()">
            @if (isLoading()) {
              <span>Creating Account...</span>
            } @else {
              <span>Create Account</span>
            }
          </button>
        </form>

        <div class="auth-card-footer">
          <p>Already registered? <a routerLink="/auth/login">Sign in to your account</a></p>
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
      max-width: 520px;
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
      h2 { color: var(--text-primary) !important; font-size: 1.65rem; font-weight: 800; margin-bottom: 0.35rem; letter-spacing: -0.025em; }
      .sub-text { color: var(--text-secondary) !important; font-size: 0.875rem; font-weight: 400; }
    }
    .account-type-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .type-card {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      padding: 0.85rem;
      border-radius: 0.6rem;
      border: 1px solid var(--border-hairline);
      background: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .type-card.selected {
      border-color: var(--color-primary);
      background: var(--color-primary-50);
    }
    .type-icon { font-size: 1.3rem; }
    .type-meta { display: flex; flex-direction: column; }
    .type-title { font-size: 0.85rem; font-weight: 800; color: var(--text-primary) !important; line-height: 1.2; }
    .type-desc { font-size: 0.725rem; color: var(--text-secondary) !important; margin-top: 0.2rem; line-height: 1.35; font-weight: 400; }

    .role-selector-pills {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .pill-option {
      display: flex;
      align-items: center;
      padding: 0.65rem 0.85rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border-hairline);
      background: #ffffff;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary) !important;
      cursor: pointer;
      transition: all 0.15s ease;
      &.active {
        background: var(--color-primary-50);
        border-color: var(--color-primary);
        color: var(--color-primary) !important;
        font-weight: 700;
        span { color: var(--color-primary) !important; }
      }
    }
    .hidden-radio { display: none; }
    .alert-error {
      background: var(--color-danger-bg);
      border: 1px solid var(--color-danger-border);
      color: var(--color-danger) !important;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.25rem;
      font-size: 0.85rem;
      font-weight: 600;
      span { color: var(--color-danger) !important; }
    }
    .auth-form-layout {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.85rem;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      label { color: var(--text-primary) !important; font-size: 0.85rem; font-weight: 700; }
    }
    .field-hint { font-size: 0.75rem; color: var(--text-muted) !important; font-weight: 400; }
    .field-error { font-size: 0.75rem; color: var(--color-danger) !important; font-weight: 600; }
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
      p { color: var(--text-secondary) !important; font-size: 0.875rem; font-weight: 500; a { color: var(--color-primary) !important; text-decoration: none; font-weight: 700; &:hover { text-decoration: underline; } } }
    }
  `]
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly UserRole = UserRole;
  readonly RegistrationType = RegistrationType;
  readonly accountType = signal<RegistrationType>(RegistrationType.Individual);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly registerForm = this.fb.group({
    role: [UserRole.Instructor, Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    tenantName: ['Individual Workspace'],
    tenantIdentifier: ['default-individual'],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  setAccountType(type: RegistrationType): void {
    this.accountType.set(type);
    if (type === RegistrationType.Individual) {
      this.registerForm.patchValue({
        role: UserRole.Instructor,
        tenantName: 'Individual Workspace',
        tenantIdentifier: 'default-individual'
      });
      this.registerForm.get('tenantName')?.clearValidators();
      this.registerForm.get('tenantIdentifier')?.clearValidators();
    } else {
      this.registerForm.patchValue({
        role: UserRole.TenantAdmin,
        tenantName: '',
        tenantIdentifier: ''
      });
      this.registerForm.get('tenantName')?.setValidators([Validators.required]);
      this.registerForm.get('tenantIdentifier')?.setValidators([Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]);
    }
    this.registerForm.get('tenantName')?.updateValueAndValidity();
    this.registerForm.get('tenantIdentifier')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const values = this.registerForm.value;
    const isIndividual = this.accountType() === RegistrationType.Individual;

    const firstName = values.firstName!.trim();
    const lastName = values.lastName!.trim();
    
    const tenantName = isIndividual ? `${firstName}'s Personal Academy` : values.tenantName!;
    const cleanSlug = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const tenantIdentifier = isIndividual ? `indiv-${cleanSlug}-${randSuffix}` : values.tenantIdentifier!.toLowerCase().trim();

    this.authService.register({
      firstName,
      lastName,
      tenantName,
      tenantIdentifier,
      email: values.email!,
      password: values.password!,
      role: values.role!
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Registration failed. Please check your inputs.');
        this.errorMessage.set(msg);
      }
    });
  }
}

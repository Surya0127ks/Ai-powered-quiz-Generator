import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CertificateService } from '../../../core/services/certificate.service';
import { VerifyCertificateResult } from '../../../core/models/certificate.model';

@Component({
  selector: 'app-certificate-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="verify-container">
      <header class="verify-header">
        <h1>Official Certificate Verification Portal</h1>
        <p>Verify authentic completion credentials issued by Quizzy AI</p>
      </header>

      <div class="search-card glass-panel">
        <form [formGroup]="searchForm" (ngSubmit)="onVerify()" class="search-form">
          <input
            type="text"
            formControlName="code"
            placeholder="Enter Certificate Code (e.g. CERT-LMS-2026-X89A)"
            class="form-control"
          />
          <button type="submit" [disabled]="searchForm.invalid || isSearching()" class="btn btn-primary">
            {{ isSearching() ? 'Verifying...' : 'Verify Credential' }}
          </button>
        </form>
      </div>

      @if (result()) {
        <div class="result-card glass-panel margin-top" [class.valid]="result()?.isValid" [class.invalid]="!result()?.isValid">
          <div class="result-header">
            <span class="status-icon">{{ result()?.isValid ? '✓' : '❌' }}</span>
            <h3>{{ result()?.isValid ? 'Verified Authentic Certificate' : 'Invalid Certificate' }}</h3>
          </div>

          <p class="result-msg">{{ result()?.verificationMessage }}</p>

          @if (result()?.isValid) {
            <div class="cert-details-grid">
              <div class="detail-item">
                <span class="label">Certificate Code</span>
                <span class="value">{{ result()?.certificateNumber }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Issued To</span>
                <span class="value">{{ result()?.studentName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Course Title</span>
                <span class="value">{{ result()?.courseTitle }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Issue Date</span>
                <span class="value">{{ result()?.issuedAtUtc | date:'mediumDate' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Issuing Organization</span>
                <span class="value">{{ result()?.organizationName }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .verify-container { padding: 2.5rem 1.25rem; max-width: 780px; margin: 0 auto; color: var(--text-body); text-align: center; }
    .verify-header { margin-bottom: 1.75rem; h1 { font-size: clamp(1.5rem, 3.5vw, 2.15rem); font-weight: 800; color: var(--text-heading); margin: 0 0 0.5rem 0; letter-spacing: -0.02em; } p { color: var(--text-muted); margin: 0; font-size: 0.95rem; } }
    .glass-panel { background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: 1rem; padding: 1.75rem; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05); }
    .search-form { display: flex; gap: 0.75rem; }
    .form-control { flex: 1; background: var(--bg-app); border: 1px solid var(--border-hairline); border-radius: 0.5rem; padding: 0.8rem 1rem; color: var(--text-body); outline: none; font-size: 0.95rem; min-width: 0; }
    .form-control:focus { border-color: var(--color-primary-500); box-shadow: 0 0 0 3px rgba(74, 124, 179, 0.14); }
    .margin-top { margin-top: 1.5rem; }
    .result-card.valid { border-color: var(--color-success-border); background: var(--color-success-bg); }
    .result-card.invalid { border-color: var(--color-danger-border); background: var(--color-danger-bg); }
    .result-header { display: flex; align-items: center; justify-content: center; gap: 0.5rem; h3 { font-size: 1.25rem; margin: 0; color: var(--text-heading); } }
    .status-icon { font-size: 1.35rem; font-weight: 800; }
    .result-msg { color: var(--text-secondary); margin: 0.5rem 0 1.25rem 0; font-size: 0.92rem; }
    .cert-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.15rem; text-align: left; background: var(--bg-surface); border: 1px solid var(--border-hairline); padding: 1.35rem; border-radius: 0.75rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
    .label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em; }
    .value { font-weight: 600; font-size: 0.95rem; color: var(--text-heading); word-break: break-word; }
    .btn { padding: 0.8rem 1.4rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer; border: none; font-size: 0.92rem; white-space: nowrap; }
    .btn-primary { background: var(--color-primary-600); color: #ffffff; transition: background 0.15s ease; }
    .btn-primary:hover { background: var(--color-primary-700); }

    @media (max-width: 600px) {
      .verify-container { padding: 1.75rem 1rem; }
      .glass-panel { padding: 1.25rem; }
      .search-form { flex-direction: column; }
      .btn { width: 100%; }
      .cert-details-grid { grid-template-columns: 1fr; padding: 1rem; gap: 0.9rem; }
    }
  `]
})
export class CertificateVerifyComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly certificateService = inject(CertificateService);
  private readonly route = inject(ActivatedRoute);

  readonly result = signal<VerifyCertificateResult | null>(null);
  readonly isSearching = signal(false);

  readonly searchForm = this.fb.group({
    code: ['', Validators.required]
  });

  ngOnInit(): void {
    const codeParam = this.route.snapshot.queryParamMap.get('code');
    if (codeParam) {
      this.searchForm.patchValue({ code: codeParam });
      this.verify(codeParam);
    }
  }

  onVerify(): void {
    if (this.searchForm.invalid) return;
    const code = this.searchForm.value.code!;
    this.verify(code);
  }

  verify(code: string): void {
    this.isSearching.set(true);
    this.certificateService.verifyCertificate(code).subscribe({
      next: (res) => {
        this.result.set(res);
        this.isSearching.set(false);
      },
      error: () => this.isSearching.set(false)
    });
  }
}

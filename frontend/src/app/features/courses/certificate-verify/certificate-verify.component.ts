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
        <p>Verify authentic completion credentials issued by LMS SaaS Academy</p>
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
    .verify-container { padding: 3rem 1.5rem; max-width: 800px; margin: 0 auto; color: #f8fafc; text-align: center; }
    .verify-header { margin-bottom: 2rem; h1 { font-size: 2.25rem; font-weight: 700; color: #38bdf8; margin: 0 0 0.5rem 0; } p { color: #94a3b8; } }
    .glass-panel { background: rgba(30, 41, 59, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; padding: 2rem; }
    .search-form { display: flex; gap: 0.75rem; }
    .form-control { flex: 1; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 0.5rem; padding: 0.85rem 1rem; color: #f8fafc; outline: none; font-size: 1rem; }
    .margin-top { margin-top: 2rem; }
    .result-card.valid { border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05); }
    .result-card.invalid { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.05); }
    .result-header { display: flex; align-items: center; justify-content: center; gap: 0.5rem; h3 { font-size: 1.35rem; margin: 0; } }
    .status-icon { font-size: 1.5rem; font-weight: 800; }
    .result-msg { color: #cbd5e1; margin: 0.5rem 0 1.5rem 0; }
    .cert-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; text-align: left; background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 0.75rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .value { font-weight: 600; font-size: 0.95rem; color: #f8fafc; }
    .btn { padding: 0.85rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; border: none; }
    .btn-primary { background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #fff; }
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

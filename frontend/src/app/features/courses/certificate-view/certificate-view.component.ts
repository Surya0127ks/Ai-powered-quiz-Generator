import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CertificateService } from '../../../core/services/certificate.service';
import { Certificate } from '../../../core/models/certificate.model';

@Component({
  selector: 'app-certificate-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="cert-page-container">
      <header class="cert-header no-print">
        <a routerLink="/my-courses" class="back-link">← Back to My Courses</a>
        <div class="actions-right">
          <button (click)="printCertificate()" class="btn btn-primary">🖨️ Print / Save as PDF</button>
          <a routerLink="/verify-certificate" class="btn btn-outline">🔍 Verify Credentials</a>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading-state saas-card no-print">
          <div class="spinner"></div> Generating your official completion certificate...
        </div>
      } @else if (certificate()) {
        <!-- Diploma Certificate Frame -->
        <div class="diploma-frame saas-card" id="printable-certificate">
          <div class="gold-inner-border">
            <div class="diploma-header">
              <div class="academy-seal">🎓</div>
              <h2>Certificate of Completion</h2>
              <span class="sub-header">PROUDLY PRESENTED TO</span>
            </div>

            <div class="recipient-name">
              {{ certificate()?.studentName }}
            </div>

            <p class="diploma-body">
              For successfully mastering all coursework, assessments, and practical assignments for
            </p>

            <div class="course-title">
              {{ certificate()?.courseTitle }}
            </div>

            <div class="diploma-footer">
              <div class="signature-block">
                <div class="sig-line">LMS Executive Board</div>
                <span class="sig-label">Authorized Signature</span>
              </div>

              <div class="qr-block">
                <div class="qr-code-img">
                  <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=' + getVerifyUrl()" alt="Verification QR Code" />
                </div>
                <span class="qr-label">Scan to Verify</span>
              </div>

              <div class="verification-meta">
                <span class="cert-code">ID: {{ certificate()?.certificateNumber }}</span>
                <span class="issue-date">Issued: {{ certificate()?.issuedAtUtc | date:'longDate' }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cert-page-container { padding: 2.25rem 1.5rem; max-width: 1050px; margin: 0 auto; }
    .cert-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .back-link { color: #2563eb !important; text-decoration: none; font-size: 0.875rem; font-weight: 700; }
    .actions-right { display: flex; gap: 0.75rem; }

    .diploma-frame {
      background: #ffffff;
      border: 3.5px solid #d97706;
      border-radius: 1.25rem;
      padding: 2.5rem;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    }
    .gold-inner-border {
      border: 2px solid #fde68a;
      padding: 3.0rem 2.5rem;
      border-radius: 0.75rem;
      text-align: center;
      background: linear-gradient(180deg, #ffffff 0%, #fffbe5 100%);
    }
    .diploma-header {
      h2 { font-size: 2.5rem; font-family: 'Plus Jakarta Sans', serif; font-weight: 800; color: #b45309 !important; margin: 0.5rem 0 0.25rem 0; letter-spacing: -0.02em; }
    }
    .academy-seal { font-size: 3.5rem; }
    .sub-header { font-size: 0.8rem; font-weight: 800; letter-spacing: 3px; color: #64748b !important; text-transform: uppercase; }
    
    .recipient-name {
      font-size: 2.75rem;
      font-weight: 800;
      color: #0f172a !important;
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin: 1.5rem 0;
      text-decoration: underline;
      text-underline-offset: 8px;
      text-decoration-color: #2563eb;
    }
    .diploma-body { font-size: 1.05rem; color: #334155 !important; max-width: 620px; margin: 0 auto 1.5rem auto; line-height: 1.6; }
    .course-title { font-size: 1.85rem; font-weight: 800; color: #2563eb !important; margin-bottom: 3rem; }
    
    .diploma-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1.5px solid #fde68a; padding-top: 2rem; }
    .signature-block { text-align: left; .sig-line { font-size: 1.25rem; font-weight: 800; color: #0f172a !important; border-bottom: 1.5px solid #64748b; padding-bottom: 0.25rem; } .sig-label { font-size: 0.75rem; color: #64748b !important; font-weight: 700; margin-top: 0.25rem; display: block; } }
    
    .qr-block { display: flex; flex-direction: column; align-items: center; }
    .qr-code-img { width: 90px; height: 90px; padding: 0.35rem; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 0.5rem; img { width: 100%; height: 100%; } }
    .qr-label { font-size: 0.725rem; color: #64748b !important; font-weight: 700; margin-top: 0.35rem; }
    
    .verification-meta { text-align: right; display: flex; flex-direction: column; font-size: 0.825rem; color: #64748b !important; }
    .cert-code { font-weight: 800; color: #0f172a !important; }
    
    .loading-state { padding: 4rem; text-align: center; color: #64748b !important; font-weight: 600; }

    /* Print Styles */
    @media print {
      .no-print { display: none !important; }
      body { background: #ffffff !important; }
      .cert-page-container { padding: 0 !important; max-width: 100% !important; }
      .diploma-frame { border: 4px solid #b45309 !important; box-shadow: none !important; border-radius: 0 !important; }
    }
  `]
})
export class CertificateViewComponent implements OnInit {
  private readonly certificateService = inject(CertificateService);
  private readonly route = inject(ActivatedRoute);

  readonly certificate = signal<Certificate | null>(null);
  readonly isLoading = signal(true);

  courseId!: string;

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
    if (this.courseId) {
      this.loadOrGenerateCertificate();
    }
  }

  loadOrGenerateCertificate(): void {
    this.isLoading.set(true);
    this.certificateService.generateCertificate(this.courseId).subscribe({
      next: (cert) => {
        this.certificate.set(cert);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getVerifyUrl(): string {
    const code = this.certificate()?.certificateNumber || 'VALID';
    return `${window.location.origin}/verify-certificate?code=${code}`;
  }

  printCertificate(): void {
    window.print();
  }
}

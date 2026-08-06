import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type CertificateTheme = 'gold' | 'violet' | 'onyx' | 'emerald';

@Component({
  selector: 'app-certificate-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="cert-studio-container">
      <!-- Header -->
      <header class="studio-header no-print">
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        <div class="header-main-row">
          <div>
            <h1>📜 Custom Certificate Studio</h1>
            <p>Generate, customize, and issue official verified certificates with custom organization branding.</p>
          </div>
          <div class="header-actions">
            <button (click)="printCertificate()" class="btn btn-primary">
              🖨️ Print / Save as PDF
            </button>
            <button (click)="copyVerificationLink()" class="btn btn-outline">
              📋 Copy Verification Link
            </button>
          </div>
        </div>
      </header>

      <!-- Toast Notification -->
      @if (toastMessage()) {
        <div class="toast-notification no-print">
          {{ toastMessage() }}
        </div>
      }

      <!-- Main 2-Column Layout (Controls + Live Preview) -->
      <div class="studio-grid">
        <!-- Controls Column -->
        <div class="saas-card controls-card no-print">
          <h3>⚙️ Certificate Customizer</h3>
          <p class="card-desc">Configure recipient details, organization branding, and visual templates.</p>

          <!-- Theme Selector -->
          <div class="form-group">
            <label>Certificate Design Template</label>
            <div class="theme-selector-grid">
              <button
                type="button"
                [class.selected]="selectedTheme() === 'gold'"
                (click)="selectedTheme.set('gold')"
                class="theme-btn theme-gold"
              >
                <span>🏅 Gold Classic</span>
              </button>

              <button
                type="button"
                [class.selected]="selectedTheme() === 'violet'"
                (click)="selectedTheme.set('violet')"
                class="theme-btn theme-violet"
              >
                <span>💜 Violet AI</span>
              </button>

              <button
                type="button"
                [class.selected]="selectedTheme() === 'onyx'"
                (click)="selectedTheme.set('onyx')"
                class="theme-btn theme-onyx"
              >
                <span>🖤 Executive Onyx</span>
              </button>

              <button
                type="button"
                [class.selected]="selectedTheme() === 'emerald'"
                (click)="selectedTheme.set('emerald')"
                class="theme-btn theme-emerald"
              >
                <span>💚 Emerald Verified</span>
              </button>
            </div>
          </div>

          <!-- Recipient Name -->
          <div class="form-group margin-top-sm">
            <label>Student / Recipient Name *</label>
            <input
              type="text"
              [(ngModel)]="studentName"
              placeholder="e.g. Suryakant Shah"
              class="input-control"
            />
          </div>

          <!-- Assessment Title -->
          <div class="form-group margin-top-sm">
            <label>Assessment / Quiz Title *</label>
            <input
              type="text"
              [(ngModel)]="assessmentTitle"
              placeholder="e.g. Advanced Angular Signals & Full-Stack Architecture"
              class="input-control"
            />
          </div>

          <!-- Organization Name -->
          <div class="form-group margin-top-sm">
            <label>Organization / Issuing Institution</label>
            <input
              type="text"
              [(ngModel)]="orgName"
              placeholder="e.g. QuizPulse Certified Academy"
              class="input-control"
            />
          </div>

          <!-- Signatory Title -->
          <div class="form-group margin-top-sm">
            <label>Authorized Signatory / Title</label>
            <input
              type="text"
              [(ngModel)]="signatoryTitle"
              placeholder="e.g. Director of Academic Assessment"
              class="input-control"
            />
          </div>

          <div class="form-grid-2 margin-top-sm">
            <div class="form-group">
              <label>Grade / Score Note</label>
              <input
                type="text"
                [(ngModel)]="scoreNote"
                placeholder="e.g. Score: 95% · Distinction"
                class="input-control"
              />
            </div>

            <div class="form-group">
              <label>Org Monogram / Initials</label>
              <input
                type="text"
                [(ngModel)]="orgMonogram"
                placeholder="e.g. QP"
                maxLength="4"
                class="input-control uppercase"
              />
            </div>
          </div>
        </div>

        <!-- Live Certificate Diploma Preview -->
        <div class="preview-column">
          <div class="diploma-canvas" [ngClass]="'theme-' + selectedTheme()" id="printable-certificate">
            <div class="outer-border">
              <div class="inner-border">
                <!-- Header -->
                <div class="cert-header-section">
                  <div class="org-monogram-circle">
                    {{ orgMonogram || 'QP' }}
                  </div>
                  <div class="org-name-text">{{ orgName || 'QuizPulse Certified Academy' }}</div>
                  <h2 class="cert-main-heading">Certificate of Achievement</h2>
                  <span class="cert-subheading">PROUDLY PRESENTED TO</span>
                </div>

                <!-- Recipient Name -->
                <div class="recipient-name-display">
                  {{ studentName || 'Student Name' }}
                </div>

                <!-- Body text -->
                <p class="cert-body-text">
                  for successfully demonstrating mastery and passing the official knowledge assessment in
                </p>

                <!-- Assessment Title -->
                <div class="assessment-title-display">
                  {{ assessmentTitle || 'Assessment Title' }}
                </div>

                @if (scoreNote) {
                  <div class="score-badge-tag">
                    {{ scoreNote }}
                  </div>
                }

                <!-- Footer Signatures & Meta -->
                <div class="cert-footer-section">
                  <!-- Left: Signatory -->
                  <div class="signature-box">
                    <div class="sig-script">{{ signatoryTitle || 'Executive Board' }}</div>
                    <div class="sig-line-bar"></div>
                    <span class="sig-subtitle">Authorized Signature</span>
                  </div>

                  <!-- Center: Gold Seal -->
                  <div class="seal-box">
                    <div class="seal-circle">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="8" r="7"></circle>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                      </svg>
                    </div>
                    <span class="seal-label">OFFICIAL SEAL</span>
                  </div>

                  <!-- Right: QR Code & Verification -->
                  <div class="qr-verify-box">
                    <div class="qr-code-frame">
                      <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=' + getVerifyUrl()" alt="QR Code" />
                    </div>
                    <div class="meta-details">
                      <span class="cert-id">ID: {{ certCode }}</span>
                      <span class="cert-date">Issued: {{ todayDate | date:'mediumDate' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cert-studio-container { max-width: 1280px; margin: 0 auto; padding: 2.0rem 1.5rem; }
    .studio-header { margin-bottom: 2.0rem; }
    .back-link { color: var(--color-primary) !important; font-weight: 600; text-decoration: none; font-size: 0.875rem; margin-bottom: 0.5rem; display: inline-block; }
    .header-main-row { display: flex; justify-content: space-between; align-items: flex-end; h1 { font-size: 2.0rem; font-weight: 800; color: var(--text-primary) !important; margin: 0; } p { color: var(--text-secondary) !important; font-size: 0.95rem; margin-top: 0.25rem; } }
    .header-actions { display: flex; gap: 0.75rem; }

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

    .studio-grid {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 2.0rem;
      align-items: start;
    }

    /* Controls */
    .controls-card {
      padding: 1.5rem;
      background: #ffffff;
      border: 1px solid var(--border-hairline);
      border-radius: 0.75rem;
      h3 { font-size: 1.15rem; font-weight: 800; color: var(--text-primary) !important; margin: 0; }
      .card-desc { font-size: 0.85rem; color: var(--text-muted) !important; margin: 0.25rem 0 1.25rem 0; }
    }
    .margin-top-sm { margin-top: 0.85rem; }
    .uppercase { text-transform: uppercase; }

    .theme-selector-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-top: 0.4rem;
    }
    .theme-btn {
      padding: 0.6rem 0.5rem;
      border-radius: 0.5rem;
      border: 1.5px solid var(--border-hairline);
      background: #ffffff;
      font-size: 0.775rem;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
      &:hover { border-color: var(--color-primary); }
      &.selected { border-color: var(--color-primary); background: var(--color-primary-50); color: var(--color-primary) !important; }
    }

    /* Certificate Canvas */
    .diploma-canvas {
      background: #ffffff;
      border-radius: 1.0rem;
      padding: 1.75rem;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
      transition: all 0.2s ease;
    }
    .outer-border {
      border: 4px double #D97706;
      border-radius: 0.75rem;
      padding: 0.75rem;
    }
    .inner-border {
      border: 1px solid #FDE68A;
      border-radius: 0.5rem;
      padding: 2.5rem 2.0rem;
      text-align: center;
      background: linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%);
    }

    /* Header section */
    .cert-header-section {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .org-monogram-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #D97706;
      color: #ffffff !important;
      font-weight: 900;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
    }
    .org-name-text {
      font-size: 0.85rem;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #B45309 !important;
      text-transform: uppercase;
    }
    .cert-main-heading {
      font-family: var(--font-serif);
      font-size: 2.25rem;
      font-weight: 800;
      color: #7C3AED !important;
      margin: 0.5rem 0 0.2rem 0;
      letter-spacing: -0.02em;
    }
    .cert-subheading {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 2px;
      color: #6D28D9 !important;
      text-transform: uppercase;
    }

    /* Recipient Name */
    .recipient-name-display {
      font-size: 2.5rem;
      font-weight: 900;
      color: #111827 !important;
      font-family: var(--font-serif);
      margin: 1.25rem 0;
      text-decoration: underline;
      text-underline-offset: 6px;
      text-decoration-color: #7C3AED;
    }

    .cert-body-text {
      font-size: 0.95rem;
      color: #4B5563 !important;
      max-width: 580px;
      margin: 0 auto 1.0rem auto;
      line-height: 1.5;
    }

    .assessment-title-display {
      font-size: 1.5rem;
      font-weight: 800;
      color: #4F46E5 !important;
      margin-bottom: 0.75rem;
    }

    .score-badge-tag {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.25rem 0.85rem;
      border-radius: 9999px;
      background: #ECFDF5;
      color: #059669 !important;
      border: 1px solid #A7F3D0;
      margin-bottom: 2.0rem;
    }

    /* Footer */
    .cert-footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #FDE68A;
      padding-top: 1.5rem;
      margin-top: 1.5rem;
    }

    .signature-box {
      text-align: left;
      .sig-script { font-size: 1.05rem; font-weight: 800; color: #111827 !important; font-family: serif; }
      .sig-line-bar { width: 140px; height: 1.5px; background: #9CA3AF; margin: 0.35rem 0; }
      .sig-subtitle { font-size: 0.7rem; color: #6B7280 !important; font-weight: 700; text-transform: uppercase; }
    }

    .seal-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      .seal-circle { width: 56px; height: 56px; border-radius: 50%; background: #FFFBEB; border: 2px solid #D97706; color: #D97706; display: flex; align-items: center; justify-content: center; }
      .seal-label { font-size: 0.65rem; font-weight: 800; color: #B45309 !important; letter-spacing: 1px; margin-top: 0.25rem; }
    }

    .qr-verify-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-align: right;
    }
    .qr-code-frame {
      width: 64px;
      height: 64px;
      padding: 0.25rem;
      background: #ffffff;
      border: 1px solid #E5E7EB;
      border-radius: 0.375rem;
      img { width: 100%; height: 100%; }
    }
    .meta-details {
      display: flex;
      flex-direction: column;
      font-size: 0.75rem;
      color: #6B7280 !important;
      .cert-id { font-weight: 800; color: #111827 !important; }
    }

    /* THEME VARIATIONS */
    .diploma-canvas.theme-violet {
      .outer-border { border-color: #7C3AED; }
      .inner-border { border-color: #DDD6FE; background: linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 100%); }
      .org-monogram-circle { background: #7C3AED; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); }
      .org-name-text { color: #6D28D9 !important; }
      .cert-main-heading { color: #4C1D95 !important; }
      .recipient-name-display { text-decoration-color: #7C3AED; }
      .assessment-title-display { color: #7C3AED !important; }
      .seal-circle { border-color: #7C3AED; color: #7C3AED; background: #F5F3FF; }
      .seal-label { color: #6D28D9 !important; }
    }

    .diploma-canvas.theme-onyx {
      .outer-border { border-color: #111827; }
      .inner-border { border-color: #374151; background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%); }
      .org-monogram-circle { background: #111827; box-shadow: 0 4px 12px rgba(17, 24, 39, 0.25); }
      .org-name-text { color: #374151 !important; }
      .cert-main-heading { color: #111827 !important; }
      .recipient-name-display { text-decoration-color: #111827; }
      .assessment-title-display { color: #111827 !important; }
      .seal-circle { border-color: #111827; color: #111827; background: #F3F4F6; }
      .seal-label { color: #111827 !important; }
    }

    .diploma-canvas.theme-emerald {
      .outer-border { border-color: #059669; }
      .inner-border { border-color: #A7F3D0; background: linear-gradient(180deg, #FFFFFF 0%, #ECFDF5 100%); }
      .org-monogram-circle { background: #059669; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25); }
      .org-name-text { color: #047857 !important; }
      .cert-main-heading { color: #064E3B !important; }
      .recipient-name-display { text-decoration-color: #059669; }
      .assessment-title-display { color: #059669 !important; }
      .seal-circle { border-color: #059669; color: #059669; background: #ECFDF5; }
      .seal-label { color: #047857 !important; }
    }

    /* Print Styles */
    @media print {
      .no-print { display: none !important; }
      ::ng-deep .qp-navbar, ::ng-deep .qp-footer { display: none !important; }
      ::ng-deep .app-main-layout { min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
      ::ng-deep body { background: #ffffff !important; margin: 0; padding: 0; }
      
      .cert-studio-container { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
      .studio-grid { display: block !important; }
      .diploma-canvas { box-shadow: none !important; padding: 0 !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 auto; }
      
      @page { size: landscape; margin: 0.5cm; }
    }

    @media (max-width: 1024px) {
      .studio-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .header-main-row { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .header-actions { width: 100%; flex-direction: column; }
      .header-actions .btn { width: 100%; justify-content: center; }
      
      .diploma-canvas { padding: 0.75rem; }
      .inner-border { padding: 1.25rem 0.5rem; }
      
      .org-monogram-circle { width: 44px; height: 44px; font-size: 0.9rem; }
      .cert-main-heading { font-size: 1.35rem; line-height: 1.2; text-align: center; margin-top: 0.75rem; }
      .cert-subheading { font-size: 0.65rem; }
      
      .recipient-name-display { font-size: 1.5rem; word-break: break-word; text-align: center; margin: 1rem 0; }
      .cert-body-text { font-size: 0.8rem; padding: 0 0.5rem; }
      .assessment-title-display { font-size: 1.1rem; line-height: 1.3; text-align: center; padding: 0 0.5rem; }
      .score-badge-tag { font-size: 0.75rem; margin-bottom: 1.5rem; }
      
      .cert-footer-section { flex-direction: column; align-items: center; gap: 1.5rem; padding-top: 1.25rem; margin-top: 1.25rem; }
      .signature-box { text-align: center; width: 100%; display: flex; flex-direction: column; align-items: center; }
      .qr-verify-box { flex-direction: column; justify-content: center; width: 100%; text-align: center; gap: 0.75rem; }
      .meta-details { text-align: center; align-items: center; }
    }
  `]
})
export class CertificateGeneratorComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  studentName = '';
  assessmentTitle = 'General Knowledge & Skills Assessment';
  orgName = 'QuizPulse Certified Academy';
  signatoryTitle = 'Director of Assessment';
  scoreNote = 'Score: 90% · Certificate of Distinction';
  orgMonogram = 'QP';
  certCode = 'CERT-' + Math.floor(100000 + Math.random() * 900000);
  todayDate = new Date();

  readonly selectedTheme = signal<CertificateTheme>('violet');
  readonly toastMessage = signal<string | null>(null);

  ngOnInit(): void {
    const u = this.authService.currentUser();
    if (u) {
      this.studentName = `${u.firstName} ${u.lastName}`;
    }

    this.route.queryParams.subscribe(params => {
      if (params['title']) this.assessmentTitle = params['title'];
      if (params['student']) this.studentName = params['student'];
      if (params['score']) this.scoreNote = `Score: ${params['score']}% · Passed`;
    });
  }

  getVerifyUrl(): string {
    return `${window.location.origin}/verify-certificate?code=${this.certCode}`;
  }

  printCertificate(): void {
    window.print();
  }

  copyVerificationLink(): void {
    navigator.clipboard.writeText(this.getVerifyUrl()).then(() => {
      this.toastMessage.set('📋 Verification link copied to clipboard!');
      setTimeout(() => this.toastMessage.set(null), 3000);
    });
  }
}

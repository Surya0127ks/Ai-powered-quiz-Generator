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
    <div class="success-wrapper">

      <!-- Confetti bubbles -->
      <div class="confetti-bg" aria-hidden="true">
        <span class="bubble b1"></span>
        <span class="bubble b2"></span>
        <span class="bubble b3"></span>
        <span class="bubble b4"></span>
        <span class="bubble b5"></span>
        <span class="bubble b6"></span>
      </div>

      @if (isLoading()) {
        <div class="loading-card">
          <div class="spin-ring"></div>
          <p class="loading-text">Loading quiz details...</p>
        </div>
      } @else if (quiz()) {

        <!-- Hero Banner -->
        <div class="hero-card">
          <div class="hero-icon-wrap">
            <span class="hero-emoji">🎉</span>
            <div class="hero-ring r1"></div>
            <div class="hero-ring r2"></div>
          </div>
          <h1 class="hero-title">Quiz Published Successfully!</h1>
          <p class="hero-sub">
            "<strong>{{ quiz()?.title }}</strong>" is now live.<br>
            Share the link below with your students — they can attempt it on any device!
          </p>

          <!-- Quick Stats Row -->
          <div class="stats-row">
            <div class="stat-chip">
              <span class="stat-icon">❓</span>
              <div>
                <span class="stat-val">{{ quiz()?.questions?.length ?? 0 }}</span>
                <span class="stat-label">Questions</span>
              </div>
            </div>
            <div class="stat-chip">
              <span class="stat-icon">⏱️</span>
              <div>
                <span class="stat-val">{{ quiz()?.timeLimitMinutes ? quiz()!.timeLimitMinutes + ' min' : 'No limit' }}</span>
                <span class="stat-label">Time Limit</span>
              </div>
            </div>
            <div class="stat-chip">
              <span class="stat-icon">🎯</span>
              <div>
                <span class="stat-val">{{ quiz()?.passingScorePercentage ?? 70 }}%</span>
                <span class="stat-label">Pass Mark</span>
              </div>
            </div>
            <div class="stat-chip">
              <span class="stat-icon">📊</span>
              <div>
                <span class="stat-val">{{ quiz()?.difficulty ?? 'Mixed' }}</span>
                <span class="stat-label">Difficulty</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Share Section -->
        <div class="panel share-panel">
          <div class="panel-head">
            <div class="panel-icon-box share-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
            <div>
              <h2 class="panel-title">Share with Students</h2>
              <p class="panel-desc">Copy this link and send it via WhatsApp, email, or your class group.</p>
            </div>
          </div>

          <div class="link-row">
            <div class="link-input-wrap">
              <svg class="link-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <input
                type="text"
                [value]="quizUrl()"
                readonly
                class="link-input"
                #linkInput
                id="quiz-share-link"
              />
            </div>
            <button
              id="copy-link-btn"
              (click)="copyLink(linkInput)"
              class="copy-btn"
              [class.copied]="linkCopied()"
            >
              @if (linkCopied()) {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy Link
              }
            </button>
          </div>

          <!-- Share action buttons -->
          <div class="share-quick-row">
            <a
              [href]="'https://wa.me/?text=' + encodeUrl('Hey! Take this quiz: ' + quizUrl())"
              target="_blank"
              rel="noopener noreferrer"
              class="share-pill whatsapp"
            >
              <span>📱</span> WhatsApp
            </a>
            <a
              [href]="'mailto:?subject=Take+this+Quiz&body=' + encodeUrl('Hi! Attempt this quiz: ' + quizUrl())"
              class="share-pill email"
            >
              <span>✉️</span> Email
            </a>
            <button (click)="copyLink(linkInput)" class="share-pill copy-pill">
              <span>🔗</span> Copy URL
            </button>
          </div>

          <!-- QR Code -->
          <div class="qr-divider">
            <span>Or share via QR Code</span>
          </div>
          <div class="qr-wrap">
            <div class="qr-box">
              <img
                [src]="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=' + encodeUrl(quizUrl())"
                alt="Quiz QR Code"
                class="qr-img"
              />
            </div>
            <div class="qr-info">
              <p class="qr-hint">📲 Students can scan this QR code to open the quiz directly on their phone.</p>
              <a
                [href]="'https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=15&data=' + encodeUrl(quizUrl())"
                download="quiz-qr-code.png"
                target="_blank"
                class="qr-download-btn"
              >
                ⬇️ Download QR Code
              </a>
            </div>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="actions-grid">

          <!-- Preview / Play -->
          <div class="action-card preview-card">
            <div class="action-card-icon">▶️</div>
            <div class="action-card-body">
              <h3>Preview Your Quiz</h3>
              <p>Test the quiz flow and review your questions exactly as students will see them.</p>
            </div>
            <a [routerLink]="['/quiz', quiz()?.id]" id="preview-quiz-btn" class="action-btn preview-btn">
              Start Preview
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>

          <!-- Edit Quiz -->
          <div class="action-card edit-card">
            <div class="action-card-icon">✏️</div>
            <div class="action-card-body">
              <h3>Edit Quiz</h3>
              <p>Modify questions, update settings, change the time limit or passing score.</p>
            </div>
            <a [routerLink]="['/quiz', quiz()?.id, 'edit']" id="edit-quiz-btn" class="action-btn edit-btn">
              Edit Quiz
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </a>
          </div>

          <!-- Dashboard -->
          <div class="action-card dash-card">
            <div class="action-card-icon">🏠</div>
            <div class="action-card-body">
              <h3>Back to Dashboard</h3>
              <p>View all your quizzes, track student attempts, and manage your courses.</p>
            </div>
            <a routerLink="/dashboard" id="dashboard-btn" class="action-btn dash-btn">
              Dashboard
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>

        </div>

      } @else {
        <div class="error-card">
          <div class="error-icon">⚠️</div>
          <h2>Could not load quiz details</h2>
          <p>The quiz may have been deleted or you don't have access to it.</p>
          <a routerLink="/dashboard" class="action-btn dash-btn" style="display:inline-flex; margin-top: 1rem;">
            ← Back to Dashboard
          </a>
        </div>
      }

    </div>
  `,
  styles: [`
    /* ============================================================
       Quiz Publish Success — Professional Design System
       Uses app-wide CSS design tokens for consistency
    ============================================================ */

    /* ── Wrapper & Background ── */
    .success-wrapper {
      min-height: calc(100vh - 64px);
      background: var(--bg-app);
      padding: clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 4vw, 1.5rem);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(1rem, 3vw, 1.5rem);
    }

    /* ── Ambient background orbs ── */
    .confetti-bg {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .bubble {
      position: absolute;
      border-radius: 50%;
      opacity: 0.055;
      animation: float-orb 9s infinite ease-in-out;
    }
    .b1 { width: 280px; height: 280px; background: radial-gradient(circle, #6366f1, transparent); top: -5%;  left: -5%;  animation-delay: 0s;   animation-duration: 10s; }
    .b2 { width: 180px; height: 180px; background: radial-gradient(circle, #7c3aed, transparent); top: 40%;  right: -4%; animation-delay: 2.5s; animation-duration: 12s; }
    .b3 { width: 120px; height: 120px; background: radial-gradient(circle, #06b6d4, transparent); top: 15%;  right: 22%; animation-delay: 5s;   animation-duration: 8s;  }
    .b4 { width: 220px; height: 220px; background: radial-gradient(circle, #8b5cf6, transparent); bottom: 5%; left: 10%;  animation-delay: 1s;   animation-duration: 11s; }
    .b5 { width: 140px; height: 140px; background: radial-gradient(circle, #a78bfa, transparent); bottom: 20%;right: 15%; animation-delay: 3.5s; animation-duration: 9s;  }
    .b6 { width: 80px;  height: 80px;  background: radial-gradient(circle, #4f46e5, transparent); top: 65%;  left: 45%;  animation-delay: 7s;   animation-duration: 7s;  }
    @keyframes float-orb {
      0%,  100% { transform: translate(0, 0)    scale(1);    }
      33%        { transform: translate(8px, -18px) scale(1.04); }
      66%        { transform: translate(-6px, 10px) scale(0.97); }
    }

    /* ── Loading state ── */
    .loading-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      padding: 5rem 2rem;
      position: relative;
      z-index: 1;
    }
    .spin-ring {
      width: 48px;
      height: 48px;
      border: 3px solid var(--color-primary-100);
      border-top-color: var(--color-primary-600);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text {
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* ── Hero Banner ── */
    .hero-card {
      position: relative;
      z-index: 1;
      background: linear-gradient(145deg, #4338ca 0%, #6d28d9 45%, #7c3aed 75%, #8b5cf6 100%);
      border-radius: var(--radius-2xl);
      padding: clamp(1.75rem, 5vw, 2.75rem) clamp(1.25rem, 5vw, 2.25rem) clamp(1.5rem, 4vw, 2.25rem);
      text-align: center;
      width: 100%;
      max-width: 760px;
      box-shadow:
        0 4px 6px rgba(79,70,229,0.1),
        0 20px 48px rgba(109,40,217,0.32),
        0 0 0 1px rgba(255,255,255,0.08) inset;
      overflow: hidden;
      animation: slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    /* subtle mesh overlay */
    .hero-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 20% 0%,  rgba(255,255,255,0.1) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 100%, rgba(124,58,237,0.3) 0%, transparent 55%);
      pointer-events: none;
    }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(-20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Emoji with pulse rings */
    .hero-icon-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.1rem;
    }
    .hero-emoji {
      font-size: clamp(3rem, 8vw, 4rem);
      animation: pop 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.4) 0.15s both;
      display: block;
      position: relative;
      z-index: 2;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
    }
    @keyframes pop {
      from { transform: scale(0) rotate(-25deg); opacity: 0; }
      to   { transform: scale(1) rotate(0deg);   opacity: 1; }
    }
    .hero-ring {
      position: absolute;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.2);
      animation: pulse-ring 2.2s ease-out infinite;
    }
    .r1 { width: 76px;  height: 76px;  animation-delay: 0s;   }
    .r2 { width: 108px; height: 108px; animation-delay: 0.5s; }
    @keyframes pulse-ring {
      0%   { transform: scale(0.82); opacity: 0.9; }
      100% { transform: scale(1.45); opacity: 0;   }
    }

    .hero-title {
      font-size: clamp(1.4rem, 5vw, 1.9rem);
      font-weight: 900;
      color: #ffffff !important;
      margin: 0 0 0.5rem;
      letter-spacing: -0.035em;
      line-height: 1.15;
      position: relative;
      z-index: 1;
    }
    .hero-sub {
      font-size: clamp(0.875rem, 2.5vw, 0.975rem);
      color: rgba(255,255,255,0.82) !important;
      line-height: 1.65;
      margin: 0 auto 1.75rem;
      max-width: 480px;
      position: relative;
      z-index: 1;
    }
    .hero-sub strong { color: #ffffff !important; font-weight: 800; }

    /* Stats chips */
    .stats-row {
      display: flex;
      justify-content: center;
      gap: 0.6rem;
      flex-wrap: wrap;
      position: relative;
      z-index: 1;
    }
    .stat-chip {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: var(--radius-lg);
      padding: 0.55rem 0.8rem;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .stat-icon { font-size: 1rem; line-height: 1; }
    .stat-chip > div {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
      gap: 0.1rem;
    }
    .stat-val   { font-size: 0.82rem; font-weight: 800; color: #ffffff !important; }
    .stat-label { font-size: 0.62rem; color: rgba(255,255,255,0.65) !important; text-transform: uppercase; letter-spacing: 0.06em; }

    /* ── Content Panels ── */
    .panel {
      position: relative;
      z-index: 1;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-xl);
      padding: clamp(1.25rem, 4vw, 1.75rem);
      width: 100%;
      max-width: 760px;
      box-shadow: var(--shadow-sm);
      animation: fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .share-panel {
      animation-delay: 0.08s;
      border-top: 3px solid var(--color-primary-600);
    }

    /* Panel header row */
    .panel-head {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      margin-bottom: 1.25rem;
    }
    .panel-icon-box {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .share-icon-box {
      background: var(--color-primary-50);
      color: var(--color-primary-600);
    }
    .panel-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text-primary) !important;
      margin: 0 0 0.2rem;
      line-height: 1.2;
    }
    .panel-desc {
      font-size: 0.82rem;
      color: var(--text-muted) !important;
      margin: 0;
      line-height: 1.5;
    }

    /* ── Share Link Row ── */
    .link-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.875rem;
      align-items: stretch;
    }
    .link-input-wrap {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      min-width: 0;
    }
    .link-icon {
      position: absolute;
      left: 0.75rem;
      color: var(--text-muted);
      pointer-events: none;
      flex-shrink: 0;
    }
    .link-input {
      width: 100%;
      height: 44px;
      padding: 0 0.85rem 0 2.2rem;
      border: 1.5px solid var(--border-input);
      border-radius: var(--radius-md);
      background: var(--bg-hover);
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: 0.83rem;
      color: var(--text-body) !important;
      outline: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: border-color 0.15s ease;
    }
    .link-input:focus {
      border-color: var(--color-primary-600);
      box-shadow: 0 0 0 3px var(--color-primary-50);
    }
    .copy-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      height: 44px;
      padding: 0 1.25rem;
      border-radius: var(--radius-md);
      border: none;
      background: var(--color-primary-600);
      color: #ffffff !important;
      font-family: var(--font-body);
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.18s ease;
      min-width: 118px;
      flex-shrink: 0;
    }
    .copy-btn:hover:not(.copied) {
      background: var(--color-primary-700);
      box-shadow: 0 4px 14px rgba(79,70,229,0.35);
      transform: translateY(-1px);
    }
    .copy-btn:active { transform: translateY(0); }
    .copy-btn.copied {
      background: var(--color-success-text);
      box-shadow: none;
    }

    /* Share quick pills */
    .share-quick-row {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }
    .share-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none !important;
      transition: all 0.15s ease;
      border: 1.5px solid transparent;
      background: none;
      font-family: var(--font-body);
      line-height: 1;
    }
    .whatsapp {
      background: rgba(22,163,74,0.08);
      color: #15803d !important;
      border-color: rgba(22,163,74,0.22);
    }
    .whatsapp:hover { background: rgba(22,163,74,0.15); transform: translateY(-1px); }

    .email {
      background: rgba(37,99,235,0.08);
      color: #1d4ed8 !important;
      border-color: rgba(37,99,235,0.2);
    }
    .email:hover { background: rgba(37,99,235,0.14); transform: translateY(-1px); }

    .copy-pill {
      background: var(--color-primary-50);
      color: var(--color-primary-600) !important;
      border-color: var(--color-primary-200);
    }
    .copy-pill:hover { background: var(--color-primary-100); transform: translateY(-1px); }

    /* QR code section */
    .qr-divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1.1rem 0;
    }
    .qr-divider::before,
    .qr-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-hairline);
    }
    .qr-divider span {
      font-size: 0.75rem;
      color: var(--text-muted) !important;
      white-space: nowrap;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .qr-wrap {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .qr-box {
      background: #ffffff;
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      padding: 0.625rem;
      box-shadow: var(--shadow-sm);
      flex-shrink: 0;
    }
    .qr-img {
      width: 120px;
      height: 120px;
      display: block;
      border-radius: 4px;
    }
    .qr-info { flex: 1; min-width: 160px; }
    .qr-hint {
      font-size: 0.845rem;
      color: var(--text-secondary) !important;
      margin: 0 0 0.75rem;
      line-height: 1.6;
    }
    .qr-download-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.48rem 0.9rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-strong);
      background: var(--bg-hover);
      color: var(--text-body) !important;
      font-family: var(--font-body);
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none !important;
      transition: all 0.15s ease;
    }
    .qr-download-btn:hover {
      border-color: var(--color-primary-600);
      color: var(--color-primary-600) !important;
      background: var(--color-primary-50);
    }

    /* ── Action cards grid ── */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.875rem;
      width: 100%;
      max-width: 760px;
      position: relative;
      z-index: 1;
      animation: fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
    }
    .action-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-xl);
      padding: 1.375rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: default;
    }
    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    /* Accent top borders using CSS vars */
    .preview-card { border-top: 3px solid var(--color-primary-600); }
    .edit-card    { border-top: 3px solid var(--color-warning-text); }
    .dash-card    { border-top: 3px solid #0891b2; }

    .action-card-icon {
      font-size: 1.6rem;
      line-height: 1;
    }
    .action-card-body h3 {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text-primary) !important;
      margin: 0 0 0.2rem;
      line-height: 1.2;
    }
    .action-card-body p {
      font-size: 0.76rem;
      color: var(--text-muted) !important;
      margin: 0;
      line-height: 1.55;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.58rem 1rem;
      border-radius: var(--radius-md);
      font-family: var(--font-body);
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none !important;
      cursor: pointer;
      transition: all 0.18s ease;
      border: none;
      margin-top: auto;
      white-space: nowrap;
    }
    /* Primary — purple */
    .preview-btn {
      background: var(--color-primary-600);
      color: #ffffff !important;
    }
    .preview-btn:hover {
      background: var(--color-primary-700);
      box-shadow: 0 4px 14px rgba(79,70,229,0.35);
      transform: translateY(-1px);
    }
    /* Amber — edit */
    .edit-btn {
      background: var(--color-warning-bg);
      color: var(--color-warning-text) !important;
      border: 1.5px solid var(--color-warning-border);
    }
    .edit-btn:hover {
      background: rgba(245,158,11,0.18);
      transform: translateY(-1px);
    }
    /* Cyan — dashboard */
    .dash-btn {
      background: rgba(8,145,178,0.08);
      color: #0e7490 !important;
      border: 1.5px solid rgba(8,145,178,0.25);
    }
    .dash-btn:hover {
      background: rgba(8,145,178,0.14);
      transform: translateY(-1px);
    }

    /* ── Error state ── */
    .error-card {
      position: relative;
      z-index: 1;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-xl);
      padding: 3rem 2rem;
      text-align: center;
      width: 100%;
      max-width: 480px;
      box-shadow: var(--shadow-sm);
    }
    .error-icon  { font-size: 2.75rem; margin-bottom: 0.875rem; }
    .error-card h2 {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-primary) !important;
      margin-bottom: 0.5rem;
    }
    .error-card p { color: var(--text-muted) !important; font-size: 0.875rem; line-height: 1.6; }

    /* ============================================================
       RESPONSIVE — Tablet (≤ 768px)
    ============================================================ */
    @media (max-width: 768px) {
      .actions-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .dash-card {
        grid-column: 1 / -1;
      }
      .stats-row {
        gap: 0.45rem;
      }
    }

    /* ============================================================
       RESPONSIVE — Mobile (≤ 540px)
    ============================================================ */
    @media (max-width: 540px) {
      .success-wrapper {
        padding: 1rem 0.875rem;
        gap: 0.875rem;
      }
      .hero-card {
        border-radius: var(--radius-xl);
        padding: 1.75rem 1.1rem 1.5rem;
      }
      .hero-title  { font-size: 1.3rem; letter-spacing: -0.025em; }
      .hero-sub    { font-size: 0.84rem; margin-bottom: 1.25rem; }
      .stat-chip   { padding: 0.45rem 0.65rem; }
      .stat-val    { font-size: 0.78rem; }
      .stat-label  { font-size: 0.58rem; }

      .panel { border-radius: var(--radius-xl); padding: 1.125rem; }
      .panel-head  { gap: 0.75rem; margin-bottom: 1rem; }
      .panel-icon-box { width: 38px; height: 38px; }

      /* Full-width link row stacked vertically */
      .link-row    { flex-direction: column; gap: 0.45rem; }
      .link-input  { height: 48px; font-size: 0.8rem; }
      .copy-btn    { width: 100%; height: 48px; font-size: 0.9rem; min-width: unset; }

      /* Larger share pills for touch */
      .share-pill  { padding: 0.55rem 1rem; font-size: 0.85rem; }
      .share-quick-row { gap: 0.5rem; }

      /* QR stacked */
      .qr-wrap     { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .qr-img      { width: 110px; height: 110px; }

      /* Action cards all stacked */
      .actions-grid { grid-template-columns: 1fr; gap: 0.625rem; }
      .dash-card    { grid-column: unset; }
      .action-card  { padding: 1.125rem 1rem; flex-direction: row; align-items: center; gap: 0.875rem; }
      .action-card-icon { font-size: 1.4rem; flex-shrink: 0; }
      .action-card-body { flex: 1; min-width: 0; }
      .action-card-body h3 { font-size: 0.875rem; }
      .action-card-body p  { display: none; /* hide desc on small screens */ }
      .action-btn  { flex-shrink: 0; padding: 0.55rem 0.9rem; font-size: 0.8rem; }
    }

    /* ============================================================
       DARK MODE — uses app-wide CSS tokens automatically
       Some overrides for elements that use hard-coded values
    ============================================================ */
    @media (prefers-color-scheme: dark) {
      .qr-box { border-color: rgba(255,255,255,0.1); }
      .link-input { color: var(--text-body) !important; }
    }
    [data-theme="dark"] .qr-box { box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
    [data-theme="dark"] .link-input { color: var(--text-body) !important; }
    [data-theme="dark"] .action-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    [data-theme="dark"] .copy-btn:hover { box-shadow: 0 4px 14px rgba(99,102,241,0.4); }
    [data-theme="dark"] .share-icon-box { background: var(--color-primary-50); }
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
    const url = this.quizUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.linkCopied.set(true);
        setTimeout(() => this.linkCopied.set(false), 3000);
      }).catch(() => this.fallbackCopy(inputElement));
    } else {
      this.fallbackCopy(inputElement);
    }
  }

  private fallbackCopy(inputElement: HTMLInputElement): void {
    inputElement.select();
    inputElement.setSelectionRange(0, 99999);
    document.execCommand('copy');
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 3000);
  }

  encodeUrl(url: string): string {
    return encodeURIComponent(url);
  }
}

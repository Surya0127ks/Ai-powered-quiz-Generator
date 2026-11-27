import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserRole } from '../../core/models/auth.model';

interface FaqItem {
  question: string;
  answer: string;
  open?: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page">
      <!-- Quiet Single-Row Navigation -->
      <nav class="landing-navbar" aria-label="Main navigation">
        <div class="nav-container">
          <a routerLink="/" class="brand-logo">
            <span class="logo-box" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </span>
            <span class="brand-title">Quizzy AI</span>
          </a>

          <div class="nav-actions">
            <a routerLink="/verify-certificate" class="nav-text-link hide-xs">Verify certificate</a>
            <button
              type="button"
              (click)="themeService.toggleTheme()"
              class="theme-toggle-btn"
              [attr.aria-label]="themeService.isDarkMode() ? 'Switch to light theme' : 'Switch to dark theme'"
              [attr.aria-pressed]="themeService.isDarkMode()"
              [title]="themeService.isDarkMode() ? 'Light mode' : 'Dark mode'"
            >
              @if (themeService.isDarkMode()) {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              }
            </button>

            @if (authService.isAuthenticated()) {
              <a routerLink="/dashboard" class="btn-primary-nav">
                <span>Open dashboard</span>
              </a>
            } @else {
              <a routerLink="/auth/login" class="nav-text-link">Sign in</a>
              <a routerLink="/auth/register" class="btn-primary-nav">Get started</a>
            }
          </div>
        </div>
      </nav>

      <!-- Asymmetric Split Hero: Study Canvas + Live Assessment Sheet Visual -->
      <div class="hero-band">
      <header class="hero-section">
        <div class="hero-split">
          <div class="hero-copy">
            <span class="hero-kicker">
              <span class="kicker-dot" aria-hidden="true"></span>
              AI quiz studio · Teaching &amp; exam prep
            </span>
            <h1 class="hero-title">Structured quizzes for focused teaching and exam prep</h1>

            <p class="hero-subtitle">
              Draft 1 to 30 questions with Groq LLMs across programming, courses, and Indian competitive exams. Share one link for 50 seats or run timed private retests with certificates.
            </p>

            <div class="hero-cta">
              @if (authService.isAuthenticated()) {
                <a routerLink="/dashboard" class="btn-hero-primary">
                  <span>{{ authService.userRole() === UserRole.Student ? 'Open dashboard' : 'Dashboard' }}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
                @if (canManageQuizzes()) {
                  <a routerLink="/quizzes/new" class="btn-hero-secondary">Create quiz</a>
                }
              } @else {
                <a routerLink="/auth/register" class="btn-hero-primary">
                  <span>Start free</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
                <a routerLink="/auth/login" class="btn-hero-secondary">Sign in</a>
              }
            </div>

            <div class="hero-spec-strip">
              <span class="spec-item"><span class="spec-dot dot-blue"></span>1–30 questions</span>
              <span class="spec-sep" aria-hidden="true">·</span>
              <span class="spec-item"><span class="spec-dot dot-emerald"></span>Up to 50 seats</span>
              <span class="spec-sep" aria-hidden="true">·</span>
              <span class="spec-item"><span class="spec-dot dot-teal"></span>Private retests</span>
              <span class="spec-sep" aria-hidden="true">·</span>
              <span class="spec-item"><span class="spec-dot dot-amber"></span>24h auto-clean</span>
            </div>
          </div>

          <!-- Signature Product Moment: Live Exam Folio Sheet -->
          <div class="hero-visual">
            <div class="exam-folio">
              <div class="folio-header">
                <span class="folio-url">quizzy-ai.app/q/cs-systems-04</span>
                <span class="folio-meta">Q05 / 20 · 14:20 left</span>
              </div>

              <div class="folio-progress-track" aria-hidden="true">
                <div class="folio-progress-fill"></div>
              </div>

              <div class="folio-body">
                <div class="folio-question-block">
                  <div class="folio-q-meta">
                    <span class="folio-q-num">Q05</span>
                    <span class="folio-q-tag">Systems · Medium</span>
                  </div>
                  <p class="folio-q-text">
                    Which technique improves multi-step reasoning consistency in language models without updating weights?
                  </p>
                </div>

                <div class="folio-options">
                  <div class="folio-opt">
                    <span class="folio-key">A</span>
                    <span class="folio-opt-text">Zero-shot greedy token decoding</span>
                  </div>
                  <div class="folio-opt selected">
                    <span class="folio-key active-key">B</span>
                    <span class="folio-opt-text">Chain-of-thought prompting with worked exemplars</span>
                    <svg class="folio-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div class="folio-opt">
                    <span class="folio-key">C</span>
                    <span class="folio-opt-text">Increasing sampling temperature to 1.8</span>
                  </div>
                  <div class="folio-opt">
                    <span class="folio-key">D</span>
                    <span class="folio-opt-text">Truncating the prompt context window</span>
                  </div>
                </div>

                <div class="folio-footer">
                  <p class="folio-explanation">
                    Explanation: Worked step-by-step exemplars guide intermediate reasoning before producing a final answer.
                  </p>
                  <div class="folio-score-slip">
                    <span class="slip-label">Result preview</span>
                    <span class="slip-figure">85% · 17/20 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      </div>

      <!-- Capabilities -->
      <section class="section">
        <div class="section-header">
          <span class="section-label">Capabilities</span>
          <h2 class="section-heading">Built for classroom tests and independent study</h2>
          <p class="section-description">Authoring, timed test delivery, submission analytics, and certificate verification in one workspace.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feat-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h3>Groq AI question drafting</h3>
            <p>Generate multiple-choice and true-false questions for any topic or syllabus, then edit questions and explanations before saving.</p>
          </div>

          <div class="feature-card">
            <div class="feat-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
            </div>
            <h3>Controlled counts and difficulty</h3>
            <p>Use 10, 15, 20, or 30 presets or any custom count from 1 to 30 with strict Easy, Medium, Hard, or Mixed difficulty rules.</p>
          </div>

          <div class="feature-card">
            <div class="feat-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <h3>Zero-friction test links</h3>
            <p>Teachers share a short URL (<code class="code-pill">/q/shortId</code>) or QR code so up to 50 learners can start without registration.</p>
          </div>

          <div class="feature-card">
            <div class="feat-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </div>
            <h3>Private student practice and retests</h3>
            <p>Student accounts can generate private study quizzes and competitive exam mocks, retake them unlimited times, and compare marks across attempts.</p>
          </div>

          <div class="feature-card">
            <div class="feat-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"></circle><path d="M8.5 13.5 7 22l5-2.5L17 22l-1.5-8.5"></path></svg>
            </div>
            <h3>Verifiable certificates</h3>
            <p>Issue completion certificates when learners pass, each carrying a unique certificate number and public verification lookup.</p>
          </div>

          <div class="feature-card">
            <div class="feat-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"></path></svg>
            </div>
            <h3>Scorecards and time analytics</h3>
            <p>Review pass rates, average completion duration, per-question tags, answer explanations, and printable scorecards.</p>
          </div>
        </div>
      </section>

      <!-- Workflow -->
      <div class="band-surface section-border-top">
      <section class="section">
        <div class="section-header">
          <span class="section-label">Workflow</span>
          <h2 class="section-heading">How Quizzy AI works</h2>
          <p class="section-description">Go from a topic prompt to a live classroom link or timed solo practice session in three steps.</p>
        </div>

        <div class="steps-grid">
          <div class="step-card">
            <span class="step-number">01</span>
            <h3>Enter topic or exam stream</h3>
            <p>Type a programming subject or select UPSC, SSC, Banking, Railways, Defence, or entrance modules. Choose 1–30 questions and difficulty.</p>
          </div>

          <div class="step-card">
            <span class="step-number">02</span>
            <h3>Review questions and rules</h3>
            <p>Inspect options, topic tags, explanations, time limits, and optional negative marking before saving or publishing.</p>
          </div>

          <div class="step-card">
            <span class="step-number">03</span>
            <h3>Deliver and track attempts</h3>
            <p>Educators review ranked submissions and scorecards; students retest privately and compare marks across every attempt.</p>
          </div>
        </div>
      </section>
      </div>

      <!-- Built For Roles -->
      <section class="section section-border-top">
        <div class="section-header">
          <span class="section-label">Who uses Quizzy AI</span>
          <h2 class="section-heading">Built for classrooms and solo preparation</h2>
        </div>

        <div class="roles-grid">
          <div class="role-card role-cobalt">
            <span class="role-label">Teachers and tutors</span>
            <h3>Run class assessments without manual formatting</h3>
            <p>Create chapter quizzes and timed tests, enforce student caps up to 50 learners, and inspect every answer sheet.</p>
            <ul class="role-bullets">
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>10, 15, 20, 30 presets or custom 1–30 counts</span>
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Auto-closes cleanly when 50 learner seats fill</span>
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Printable scorecards and class leaderboard</span>
              </li>
            </ul>
          </div>

          <div class="role-card role-emerald">
            <span class="role-label role-label-emerald">Students and self-learners</span>
            <h3>Build private drills and retest until sharp</h3>
            <p>Generate unlimited private practice quizzes or open a teacher's link. Review explanations after each submission and retest anytime.</p>
            <ul class="role-bullets">
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Private quiz creation (never shared publicly)</span>
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Compare Attempt #1, #2, #3 marks per quiz</span>
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Question-by-question answer explanations</span>
              </li>
            </ul>
          </div>

          <div class="role-card role-amber">
            <span class="role-label role-label-amber">Competitive exam aspirants</span>
            <h3>Simulate CBT negative marking and timing</h3>
            <p>Prepare for UPSC, SSC CGL/CHSL, IBPS/SBI Banking, RRB NTPC, NDA/CDS, CTET, and NEET/JEE with official deduction rules.</p>
            <ul class="role-bullets">
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Preset -0.25, -0.33, -0.50, and -1.0 penalties</span>
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Strict countdown timer with auto-submit option</span>
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Multi-statement and conceptual reasoning prompts</span>
              </li>
            </ul>
          </div>

          <div class="role-card role-teal">
            <span class="role-label role-label-teal">Academies and cohorts</span>
            <h3>Issue verifiable completion credentials</h3>
            <p>Customize organization certificates and let employers or institutions verify every issued credential online.</p>
            <ul class="role-bullets">
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Unique ID lookup via Verify Certificate</span>
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>PDF scorecard and certificate studio export</span>
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Automatic 24h quiz lifecycle keeps storage fast</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="section section-border-top">
        <div class="section-header">
          <span class="section-label">Questions</span>
          <h2 class="section-heading">Frequently asked questions</h2>
        </div>

        <div class="faq-list">
          @for (faq of faqs(); track faq.question; let i = $index) {
            <div class="faq-item" [class.open]="faq.open">
              <h3 class="faq-question-heading">
                <button
                  type="button"
                  class="faq-question-row"
                  [attr.aria-expanded]="faq.open"
                  [attr.aria-controls]="'faq-answer-' + i"
                  (click)="toggleFaq(faq)"
                >
                  <span class="faq-question-title">{{ faq.question }}</span>
                  <span class="faq-chevron" aria-hidden="true">{{ faq.open ? '−' : '+' }}</span>
                </button>
              </h3>
              @if (faq.open) {
                <div class="faq-answer-body" [id]="'faq-answer-' + i">
                  <p>{{ faq.answer }}</p>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Bottom Call To Action -->
      <section class="bottom-cta">
        <div class="cta-inner">
          <h2>Start authoring or practicing in under a minute</h2>
          <p>Sign up as a teacher to run class quizzes or as a student to build private mock tests.</p>
          <div class="cta-buttons">
            @if (authService.isAuthenticated()) {
              <a routerLink="/quizzes/new" class="btn-hero-primary">Create practice quiz</a>
              <a routerLink="/dashboard" class="btn-hero-secondary">Go to dashboard</a>
            } @else {
              <a routerLink="/auth/register" class="btn-hero-primary">Create free account</a>
              <a routerLink="/auth/login" class="btn-hero-secondary">Sign in</a>
            }
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-container">
          <div class="footer-top-row">
            <div class="footer-brand">
              <div class="brand-logo">
                <span class="logo-box" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </span>
                <span class="brand-title">Quizzy AI</span>
              </div>
              <p class="footer-tagline">Focused assessment and study platform powered by Groq LLMs.</p>
            </div>

            <div class="footer-links-group">
              <a routerLink="/dashboard">Dashboard</a>
              <a routerLink="/quizzes/new">Create quiz</a>
              <a routerLink="/verify-certificate">Verify certificate</a>
              <a routerLink="/auth/login">Sign in</a>
              <a routerLink="/auth/register">Register</a>
            </div>
          </div>

          <div class="footer-bottom-line">
            <p class="mono-meta">© {{ currentYear }} Quizzy AI</p>
            <p class="privacy-note">Educators can review submitted class attempts; student-created quizzes remain private.</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .landing-page {
      background-color: var(--bg-app);
      color: var(--text-body);
      min-height: 100vh;
      font-family: var(--font-body);
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
    }

    .nav-container, .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      width: 100%;
    }

    /* Quiet Navigation */
    .landing-navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      height: 60px;
      background: var(--nav-bg);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border-hairline);
      display: flex;
      align-items: center;
    }
    .landing-navbar .nav-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .brand-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      text-decoration: none;
    }
    .logo-box {
      width: 32px;
      height: 32px;
      background: var(--color-primary-600);
      color: #ffffff;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-heading) !important;
      letter-spacing: -0.015em;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-text-link {
      display: inline-flex;
      align-items: center;
      height: 34px;
      padding: 0 0.75rem;
      border-radius: 8px;
      color: var(--text-body) !important;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: background-color var(--transition-fast), color var(--transition-fast);
      &:hover {
        background: var(--bg-hover);
        color: var(--text-heading) !important;
      }
    }
    .theme-toggle-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      color: var(--text-body);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
      &:hover {
        background: var(--bg-hover);
        border-color: var(--border-strong);
        color: var(--text-heading);
      }
    }
    .btn-primary-nav {
      display: inline-flex;
      align-items: center;
      height: 36px;
      padding: 0 1rem;
      background: var(--color-primary-600);
      color: #ffffff !important;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 8px;
      text-decoration: none;
      transition: background-color var(--transition-fast), transform var(--transition-fast);
      &:hover { background: var(--color-primary-700); }
      &:active { transform: scale(0.985); }
    }

    /* Asymmetric Split Hero with Subtle Architectural Paper Grid */
    .hero-band {
      background-color: var(--bg-app);
      background-image:
        radial-gradient(rgba(29, 78, 216, 0.09) 1px, transparent 1px),
        linear-gradient(180deg, var(--surface-tint-blue) 0%, var(--bg-app) 100%);
      background-size: 22px 22px, 100% 100%;
      border-bottom: 1px solid var(--border-hairline);
    }
    .hero-section {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 4rem 1.5rem 4.75rem;
      min-height: calc(100svh - 60px);
      display: flex;
      align-items: center;
    }
    .hero-split {
      display: grid;
      grid-template-columns: minmax(0, 1.02fr) minmax(0, 1.15fr);
      gap: 3rem;
      align-items: center;
      width: 100%;
      min-width: 0;
    }
    .hero-copy {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      min-width: 0;
    }
    .hero-kicker {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      background: var(--bg-surface);
      border: 1px solid var(--color-primary-200);
      color: var(--color-primary-700);
      font-size: 0.75rem;
      font-weight: 500;
      margin-bottom: 0.9rem;
      box-shadow: var(--shadow-sm);
    }
    .kicker-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-primary-600);
      flex-shrink: 0;
    }
    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(2.15rem, 4.3vw, 3.5rem);
      font-weight: 500;
      color: var(--text-heading) !important;
      line-height: 1.08;
      letter-spacing: -0.025em;
      margin: 0 0 1rem 0;
    }
    .hero-subtitle {
      font-size: 1.02rem;
      color: var(--text-body);
      line-height: 1.58;
      max-width: 34rem;
      margin: 0 0 1.65rem 0;
      font-weight: 400;
    }
    .hero-cta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.35rem;
    }
    .btn-hero-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 44px;
      padding: 0 1.25rem;
      background: var(--color-primary-600);
      color: #ffffff !important;
      font-size: 0.9375rem;
      font-weight: 500;
      border-radius: 8px;
      text-decoration: none;
      transition: background-color var(--transition-fast), transform var(--transition-fast);
      &:hover { background: var(--color-primary-700); }
      &:active { transform: scale(0.985); }
    }
    .btn-hero-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 44px;
      padding: 0 1.25rem;
      background: var(--bg-surface);
      color: var(--text-heading) !important;
      border: 1px solid var(--border-strong);
      font-size: 0.9375rem;
      font-weight: 500;
      border-radius: 8px;
      text-decoration: none;
      transition: background-color var(--transition-fast), transform var(--transition-fast);
      &:hover { background: var(--bg-hover); }
      &:active { transform: scale(0.985); }
    }
    .hero-spec-strip {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.45rem 0.65rem;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
      margin: 0;
    }
    .spec-item {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      white-space: nowrap;
    }
    .spec-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-blue    { background: var(--color-primary-600); }
    .dot-emerald { background: var(--color-success-text); }
    .dot-teal    { background: var(--color-teal-text); }
    .dot-amber   { background: var(--color-warning-text); }
    .spec-sep { opacity: 0.45; }

    /* Signature Hero Visual: Live Assessment Folio Sheet */
    .hero-visual {
      width: 100%;
      min-width: 0;
    }
    .exam-folio {
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      border-top: 2px solid var(--color-primary-600);
      border-radius: 14px;
      box-shadow: 0 14px 36px rgba(21, 28, 44, 0.10);
      overflow: hidden;
      max-width: 100%;
    }
    .folio-header {
      height: 40px;
      padding: 0 1rem;
      background: var(--surface-tint-blue);
      border-bottom: 1px solid var(--border-hairline);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .folio-url, .folio-meta {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .folio-url {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .folio-progress-track {
      height: 2px;
      background: var(--border-hairline);
    }
    .folio-progress-fill {
      width: 25%;
      height: 100%;
      background: var(--color-primary-600);
    }
    .folio-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .folio-question-block {
      border-left: 2px solid var(--color-primary-600);
      padding-left: 1rem;
    }
    .folio-q-meta {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 0.375rem;
    }
    .folio-q-num {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-primary-600);
    }
    .folio-q-tag {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .folio-q-text {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-heading);
      line-height: 1.45;
      margin: 0;
    }
    .folio-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .folio-opt {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--border-hairline);
      border-radius: 8px;
      background: var(--bg-surface);
      font-size: 0.875rem;
      color: var(--text-body);
    }
    .folio-opt.selected {
      background: var(--color-primary-50);
      border-color: var(--color-primary-300);
      color: var(--text-heading);
      font-weight: 500;
    }
    .folio-key {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: 1px solid var(--border-strong);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .folio-key.active-key {
      background: var(--color-primary-600);
      border-color: var(--color-primary-600);
      color: #ffffff;
    }
    .folio-check {
      margin-left: auto;
      color: var(--color-primary-600);
      flex-shrink: 0;
    }
    .folio-footer {
      border-top: 1px solid var(--border-hairline);
      padding-top: 1rem;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }
    .folio-explanation {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.45;
      margin: 0;
      flex: 1;
    }
    .folio-score-slip {
      flex-shrink: 0;
      padding: 0.5rem 0.75rem;
      background: var(--color-success-bg);
      border: 1px solid var(--color-success-border);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }
    .slip-label {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .slip-figure {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-success-text);
      font-variant-numeric: tabular-nums;
    }

    /* Sections & Alternating Surface Rhythm */
    .band-surface {
      background: var(--bg-surface);
      width: 100%;
    }
    .section {
      padding: 5rem 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .section-border-top {
      border-top: 1px solid var(--border-hairline);
    }
    .section-header {
      max-width: 40rem;
      margin-bottom: 3rem;
    }
    .section-label {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      color: var(--color-primary-700);
      margin-bottom: 0.65rem;
    }
    .section-heading {
      font-size: clamp(1.625rem, 3vw, 2.125rem);
      font-weight: 500;
      color: var(--text-heading) !important;
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin: 0 0 0.75rem 0;
    }
    .section-description {
      font-size: 1rem;
      color: var(--text-body);
      line-height: 1.6;
      margin: 0;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.5rem;
    }
    .feature-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 12px;
      padding: 1.5rem;
      transition: border-color var(--transition-fast);
      &:hover { border-color: var(--border-strong); }
    }
    .feat-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--color-primary-200);
      background: var(--color-primary-50);
      color: var(--color-primary-600);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .feature-card:nth-child(3n+2) .feat-icon {
      border-color: var(--color-teal-border);
      background: var(--color-teal-bg);
      color: var(--color-teal-text);
    }
    .feature-card:nth-child(3n) .feat-icon {
      border-color: var(--color-success-border);
      background: var(--color-success-bg);
      color: var(--color-success-text);
    }
    .feature-card h3 {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-heading) !important;
      margin: 0 0 0.5rem 0;
    }
    .feature-card p {
      font-size: 0.875rem;
      color: var(--text-body);
      line-height: 1.55;
      margin: 0;
    }
    .code-pill {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      background: var(--color-primary-50);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--color-primary-700);
    }

    /* Workflow Steps */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.5rem;
    }
    .step-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border-hairline);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .step-number {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      font-weight: 500;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      color: var(--color-primary-700);
      margin-bottom: 0.875rem;
    }
    .step-card h3 {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-heading) !important;
      margin: 0 0 0.5rem 0;
    }
    .step-card p {
      font-size: 0.875rem;
      color: var(--text-body);
      line-height: 1.55;
      margin: 0;
    }

    /* Roles Grid */
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.5rem;
    }
    .role-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 12px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
    }
    .role-cobalt  { border-top: 2px solid var(--color-primary-600); }
    .role-emerald { border-top: 2px solid var(--color-success-text); }
    .role-amber   { border-top: 2px solid var(--color-warning-text); }
    .role-teal    { border-top: 2px solid var(--color-teal-text); }
    .role-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-primary-600);
      margin-bottom: 0.5rem;
    }
    .role-label-emerald { color: var(--color-success-text); }
    .role-label-amber   { color: var(--color-warning-text); }
    .role-label-teal    { color: var(--color-teal-text); }
    .role-card h3 {
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--text-heading) !important;
      margin: 0 0 0.625rem 0;
    }
    .role-card p {
      font-size: 0.875rem;
      color: var(--text-body);
      line-height: 1.55;
      margin: 0 0 1.25rem 0;
    }
    .role-bullets {
      list-style: none;
      padding: 0;
      margin: auto 0 0 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .role-bullets li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-body);
      svg { color: var(--color-primary-600); flex-shrink: 0; }
    }
    .role-emerald .role-bullets li svg { color: var(--color-success-text); }
    .role-amber .role-bullets li svg { color: var(--color-warning-text); }
    .role-teal .role-bullets li svg { color: var(--color-teal-text); }

    /* FAQ */
    .faq-list {
      max-width: 780px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .faq-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 12px;
      padding: 1.125rem 1.25rem;
      transition: border-color var(--transition-fast), background-color var(--transition-fast);
      &:hover { border-color: var(--border-strong); }
      &.open { border-color: var(--border-strong); }
    }
    .faq-question-heading { margin: 0; font-size: inherit; }
    .faq-question-row {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--text-heading);
      text-align: left;
      cursor: pointer;
    }
    .faq-question-title {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-heading) !important;
      line-height: 1.45;
    }
    .faq-chevron {
      font-family: var(--font-mono);
      font-size: 1.125rem;
      color: var(--text-muted);
      line-height: 1;
      flex-shrink: 0;
    }
    .faq-answer-body {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-hairline);
      p {
        font-size: 0.875rem;
        color: var(--text-body);
        line-height: 1.6;
        margin: 0;
      }
    }

    /* Bottom CTA */
    .bottom-cta {
      padding: 0 1.5rem 5rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .cta-inner {
      background: var(--surface-tint-blue);
      border: 1px solid var(--color-primary-200);
      border-radius: 16px;
      padding: 3rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      h2 {
        font-family: var(--font-display);
        font-size: clamp(1.75rem, 3.2vw, 2.25rem);
        font-weight: 500;
        color: var(--text-heading) !important;
        margin: 0;
      }
      p {
        font-size: 1rem;
        color: var(--text-body);
        max-width: 36rem;
        margin: 0 0 0.75rem 0;
      }
    }
    .cta-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    /* Footer */
    .landing-footer {
      border-top: 1px solid var(--border-hairline);
      background: var(--footer-bg);
      padding: 2.5rem 0 2rem;
      margin-top: auto;
    }
    .footer-top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--footer-bottom-border);
    }
    .footer-tagline {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .footer-links-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.5rem;
      a {
        color: var(--text-body) !important;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        &:hover { color: var(--text-heading) !important; }
      }
    }
    .footer-bottom-line {
      padding-top: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
    .mono-meta {
      font-family: var(--font-mono);
      margin: 0;
    }
    .privacy-note {
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 960px) {
      .hero-section {
        min-height: auto;
        padding: 3rem 1.5rem 4rem;
      }
      .hero-split {
        grid-template-columns: 1fr;
        gap: 2.5rem;
      }
      .features-grid, .steps-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .hide-xs { display: none; }
      .landing-navbar .nav-container { padding-inline: 0.875rem; gap: 0.5rem; }
      .nav-text-link { padding: 0 0.5rem; font-size: 0.8125rem; }
      .btn-primary-nav { padding: 0 0.75rem; font-size: 0.8125rem; }
      .hero-section { padding: 1.5rem 1rem 2.25rem; min-height: auto; }
      .hero-split { gap: 1.5rem; }
      .hero-kicker { font-size: 0.72rem; margin-bottom: 0.7rem; }
      .hero-title { font-size: clamp(1.85rem, 8.2vw, 2.25rem); margin-bottom: 0.75rem; }
      .hero-subtitle { font-size: 0.925rem; line-height: 1.5; margin-bottom: 1.15rem; }
      .hero-cta {
        display: grid;
        grid-template-columns: 1.35fr 1fr;
        gap: 0.55rem;
        width: 100%;
        margin-bottom: 1rem;
      }
      .btn-hero-primary, .btn-hero-secondary {
        width: 100%;
        height: 42px;
        padding: 0 0.75rem;
        font-size: 0.875rem;
      }
      .hero-spec-strip {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.4rem 0.65rem;
        width: 100%;
        padding: 0.65rem 0.75rem;
        background: var(--bg-surface);
        border: 1px solid var(--border-hairline);
        border-radius: 10px;
      }
      .spec-sep { display: none; }
      .folio-header { height: auto; min-height: 36px; padding: 0.45rem 0.75rem; flex-wrap: wrap; gap: 0.25rem 0.6rem; }
      .folio-body { padding: 0.9rem; gap: 0.85rem; }
      .folio-q-text { font-size: 0.875rem; }
      .folio-opt { padding: 0.52rem 0.7rem; font-size: 0.82rem; gap: 0.55rem; }
      .folio-key { width: 22px; height: 22px; font-size: 0.7rem; }
      .folio-footer { flex-direction: column; align-items: stretch; gap: 0.65rem; padding-top: 0.75rem; }
      .folio-score-slip { flex-direction: row; align-items: center; justify-content: space-between; width: 100%; }

      .section { padding: 2.5rem 1rem; }
      .section-header { margin-bottom: 1.5rem; }
      .features-grid { grid-template-columns: 1fr; gap: 0.75rem; }
      .feature-card {
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr);
        column-gap: 0.85rem;
        row-gap: 0.25rem;
        padding: 1rem;
        align-items: start;
      }
      .feature-card .feat-icon { grid-row: 1 / span 2; margin-bottom: 0; width: 38px; height: 38px; }
      .feature-card h3 { grid-column: 2; margin: 0; font-size: 0.95rem; }
      .feature-card p { grid-column: 2; font-size: 0.835rem; line-height: 1.5; }

      .steps-grid { grid-template-columns: 1fr; gap: 0.75rem; }
      .step-card { padding: 1.05rem; border-left: 2px solid var(--color-primary-300); }
      .step-number { margin-bottom: 0.5rem; }

      .roles-grid { grid-template-columns: 1fr; gap: 0.85rem; }
      .role-card { padding: 1.2rem; }
      .bottom-cta { padding: 0 1rem 2.75rem; }
      .cta-inner { padding: 1.5rem 1.1rem; }
      .cta-buttons { width: 100%; display: grid; grid-template-columns: 1.3fr 1fr; gap: 0.55rem; }
      .cta-buttons a { width: 100%; justify-content: center; }
      .footer-container { padding-inline: 1rem; }
    }
  `]
})
export class LandingComponent {
  readonly authService = inject(AuthService);
  readonly UserRole = UserRole;
  readonly themeService = inject(ThemeService);
  readonly currentYear = new Date().getFullYear();

  canManageQuizzes(): boolean {
    const role = this.authService.userRole();
    return role === UserRole.Student || role === UserRole.Instructor || role === UserRole.TenantAdmin || role === UserRole.SuperAdmin;
  }

  readonly faqs = signal<FaqItem[]>([
    {
      question: 'How does Quizzy AI draft questions?',
      answer: 'Enter any topic or exam stream and Groq LLMs generate multiple-choice and true-false questions, answer keys, and explanations. You can edit any question before saving.',
      open: true
    },
    {
      question: 'How do student practice quizzes differ from teacher quizzes?',
      answer: 'Educators can publish quizzes with a share link (/q/id) for up to 50 learners and view a class leaderboard. Student-created quizzes stay private to that student with unlimited retests and per-quiz attempt marks.',
      open: false
    },
    {
      question: 'What limits keep the platform responsive on free-tier hosting?',
      answer: 'AI generation supports 1 to 30 questions per quiz (10, 15, 20, 30 presets or custom), classes cap at 50 participants, and quizzes and attempt data clean up automatically after 24 hours.',
      open: false
    },
    {
      question: 'Do students need an account to take a class test?',
      answer: 'No. When a teacher shares a public quiz link, students can enter their details and begin directly on phone, tablet, or desktop.',
      open: false
    },
    {
      question: 'How does certificate verification work?',
      answer: 'When certificates are enabled and a learner meets the pass threshold, a unique certificate number is generated that can be checked anytime on Verify Certificate.',
      open: false
    }
  ]);

  toggleFaq(item: FaqItem): void {
    this.faqs.update(list =>
      list.map(f => ({
        ...f,
        open: f === item ? !f.open : false
      }))
    );
  }
}

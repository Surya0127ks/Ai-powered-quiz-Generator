import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

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
      <!-- Navbar -->
      <nav class="landing-navbar">
        <div class="nav-container">
          <a routerLink="/" class="brand-logo">
            <div class="logo-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <div class="brand-name-group">
              <span class="brand-title">Quizzy AI</span>
              <span class="brand-tag">v2.0</span>
            </div>
          </a>

          <div class="nav-actions">
            <!-- Theme Toggle Button -->
            <button
              (click)="themeService.toggleTheme()"
              class="theme-toggle-btn"
              [title]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            >
              {{ themeService.isDarkMode() ? '☀️' : '🌙' }}
            </button>

            @if (authService.isAuthenticated()) {
              <a routerLink="/dashboard" class="btn-dashboard">
                <span>Go to Dashboard</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
            } @else {
              <a routerLink="/auth/login" class="btn-ghost">Sign In</a>
              <a routerLink="/auth/register" class="btn-primary">Get Started Free</a>
            }
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <header class="hero-section">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="badge-pill">
            <span class="pulse-dot"></span>
            <span>Powered by Groq High-Speed LLMs</span>
          </div>

          <h1 class="hero-title">
            Create Smart AI Quizzes in Seconds.<br>
            <span class="text-gradient">Assess, Track & Certify.</span>
          </h1>

          <p class="hero-subtitle">
            Generate high-yield multiple-choice tests on any topic with custom question limits (10, 15, 20, 30, 50+) and tailored difficulty. Share instant assessment links with 50+ students concurrently and issue verifiable digital certificates.
          </p>

          <div class="hero-cta">
            @if (authService.isAuthenticated()) {
              <a routerLink="/dashboard" class="btn-hero-primary">
                <span>Open Educator Dashboard</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <a routerLink="/quizzes/new" class="btn-hero-secondary">
                <span>✨ Create Quiz Now</span>
              </a>
            } @else {
              <a routerLink="/auth/register" class="btn-hero-primary">
                <span>Start Creating for Free</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <a routerLink="/auth/login" class="btn-hero-secondary">
                <span>Sign In to Account</span>
              </a>
            }
          </div>

          <!-- Trust Badges -->
          <div class="trust-row">
            <div class="trust-item">
              <span class="trust-icon">⚡</span>
              <span>Sub-3s Generation</span>
            </div>
            <div class="trust-item">
              <span class="trust-icon">👥</span>
              <span>15–50+ Concurrent Students</span>
            </div>
            <div class="trust-item">
              <span class="trust-icon">📜</span>
              <span>Auto-Issued QR Diplomas</span>
            </div>
            <div class="trust-item">
              <span class="trust-icon">🔒</span>
              <span>Student Privacy Safe</span>
            </div>
          </div>
        </div>

        <!-- Interactive Hero Product Mockup -->
        <div class="hero-visual">
          <div class="glass-mockup">
            <div class="mockup-header">
              <div class="window-controls">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
              </div>
              <div class="mockup-url">quizzy-ai.app/q/ai-prompt-eng</div>
              <div class="live-indicator">
                <span class="live-dot"></span> LIVE TEST
              </div>
            </div>

            <div class="mockup-body">
              <div class="quiz-top-bar">
                <div>
                  <span class="quiz-topic-badge">⚡ AI & Prompt Engineering</span>
                  <h3 class="quiz-preview-title">Few-Shot Prompting & LLM Architecture</h3>
                </div>
                <div class="quiz-timer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>14:20 Remaining</span>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="progress-wrap">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Question 5 of 20 · Medium Difficulty</span>
              </div>

              <!-- Question Box -->
              <div class="question-box">
                <span class="q-label">Q5.</span>
                <p class="q-content">Which technique improves LLM reasoning consistency on multi-step arithmetic problems without fine-tuning weights?</p>
              </div>

              <!-- Options -->
              <div class="options-container">
                <div class="option-row">
                  <span class="opt-key">A</span>
                  <span class="opt-label">Zero-shot greedy decoding</span>
                </div>
                <div class="option-row selected-correct">
                  <span class="opt-key correct-key">B</span>
                  <span class="opt-label">Chain-of-Thought (CoT) prompting with step-by-step exemplars</span>
                  <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div class="option-row">
                  <span class="opt-key">C</span>
                  <span class="opt-label">Increasing token temperature to 1.8</span>
                </div>
                <div class="option-row">
                  <span class="opt-key">D</span>
                  <span class="opt-label">Truncating the context window limit</span>
                </div>
              </div>

              <!-- Live Feedback Footer -->
              <div class="mockup-footer">
                <div class="score-chip green">
                  <span>✓ Correct! Explanation: CoT prompts guide the model through intermediate steps.</span>
                </div>
                <div class="badge-chip">
                  <span>📜 85% Score qualifies for Official Certificate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Key Capabilities Section -->
      <section class="section features-section">
        <div class="section-header">
          <span class="section-tag">BUILT FOR EDUCATORS & LEARNERS</span>
          <h2 class="section-heading">Everything You Need to <span class="text-gradient">Assess Knowledge</span></h2>
          <p class="section-description">From instant prompt generation to verifiable digital certificates, Quizzy AI powers end-to-end knowledge evaluation.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feat-icon bg-indigo">⚡</div>
            <h3>Ultra-Fast Groq AI</h3>
            <p>Generate comprehensive 10, 15, 20, 30, or 50 question tests in under 3 seconds using optimized LLM models.</p>
          </div>

          <div class="feature-card">
            <div class="feat-icon bg-emerald">🎛️</div>
            <h3>Custom Limits & Difficulty</h3>
            <p>Select question counts (15, 20, 30, 50 or custom) and specify Easy, Medium, or Hard difficulty tailored to your learners.</p>
          </div>

          <div class="feature-card">
            <div class="feat-icon bg-blue">🔗</div>
            <h3>Zero-Friction Student Links</h3>
            <p>Share a direct link (<code class="code-pill">/q/shortId</code>) with students. They can take tests instantly on mobile or PC with no account setup.</p>
          </div>

          <div class="feature-card">
            <div class="feat-icon bg-purple">👥</div>
            <h3>Simultaneous Classrooms</h3>
            <p>Built to handle 15, 30, 50+ students submitting quizzes at the same time without server lag or downtime.</p>
          </div>

          <div class="feature-card">
            <div class="feat-icon bg-amber">📜</div>
            <h3>Tamper-Proof Certificates</h3>
            <p>Passing students automatically receive high-resolution certificates complete with verifiable QR codes and security keys.</p>
          </div>

          <div class="feature-card">
            <div class="feat-icon bg-rose">📊</div>
            <h3>Real-Time Analytics</h3>
            <p>Review total scores, time per question, question accuracy breakdowns, and printable candidate scorecards.</p>
          </div>
          <div class="feature-card">
            <div class="feat-icon bg-amber">🏛️</div>
            <h3>Govt & Competitive Exam Prep</h3>
            <p>Syllabus-aligned mocks for UPSC, SSC, Banking, Railways, Defence, and NEET/JEE with authentic negative marking penalties.</p>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="section workflow-section">
        <div class="section-header">
          <span class="section-tag">SIMPLE 3-STEP PROCESS</span>
          <h2 class="section-heading">How Quizzy AI Works</h2>
          <p class="section-description">Create, launch, and grade assessments in less than one minute.</p>
        </div>

        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">01</div>
            <h3>Type Prompt or Select Topic</h3>
            <p>Input any topic (e.g. Python, Molecular Biology, World History) or choose from preset academic topics. Select question count and difficulty.</p>
          </div>

          <div class="step-card">
            <div class="step-number">02</div>
            <h3>AI Builds the Assessment</h3>
            <p>Groq AI compiles challenging questions, 4 plausible options, verified answer keys, and clear explanations instantaneously.</p>
          </div>

          <div class="step-card">
            <div class="step-number">03</div>
            <h3>Share Link & Track Scores</h3>
            <p>Send the test link to your classroom. View live submissions, auto-graded scorecards, and issued digital certificates.</p>
          </div>
        </div>
      </section>

      <!-- Built For Roles Section -->
      <section class="section roles-section">
        <div class="section-header">
          <span class="section-tag">WHO USES QUIZZY AI</span>
          <h2 class="section-heading">Designed for Every Assessment Need</h2>
        </div>

        <div class="roles-grid">
          <div class="role-card">
            <div class="role-badge">FOR TEACHERS & PROFESSORS</div>
            <h3>Automate Weekly Assessments</h3>
            <p>Stop spending hours writing quizzes by hand. Create practice sets, midterms, and chapter reviews in clicks with full curriculum alignment.</p>
            <ul class="role-bullets">
              <li>✓ Flexible 15, 20, 30, 50 question presets</li>
              <li>✓ Instant anti-cheat countdown timers</li>
              <li>✓ Printable official student scorecards</li>
            </ul>
          </div>

          <div class="role-card highlight-role">
            <div class="role-badge">FOR STUDENTS & LEARNERS</div>
            <h3>Master Any Subject</h3>
            <p>Turn study sessions into engaging active-recall assessments. Get explanations for every mistake and earn verifiable certificates.</p>
            <ul class="role-bullets">
              <li>✓ No signup needed to take shared tests</li>
              <li>✓ Mobile-friendly distraction-free player</li>
              <li>✓ Instant scorecards & certificate downloads</li>
            </ul>
          </div>

          <div class="role-card">
            <div class="role-badge">FOR ACADEMIES & TRAINERS</div>
            <h3>Professional Certification</h3>
            <p>Issue branded completion certificates with unique verification links to validate course completion and employee onboarding.</p>
            <ul class="role-bullets">
              <li>✓ QR-code verifiable certificates</li>
              <li>✓ Organization branding studio</li>
              <li>✓ Cohort attempt tracking</li>
            </ul>
          </div>

          <div class="role-card govt-role-card">
            <div class="role-badge badge-amber">FOR GOVT & COMPETITIVE EXAM ASPIRANTS</div>
            <h3>Crack Govt Exams with AI Mocks</h3>
            <p>Simulate official computer-based tests (CBT) with authentic negative marking schemes, timers, and rigorous PYQ patterns.</p>
            <ul class="role-bullets">
              <li>✓ UPSC, SSC CGL/CHSL, Banking, Railways & Defence</li>
              <li>✓ Official negative marking (-0.25, -0.33, -0.50, -1.0)</li>
              <li>✓ Multi-statement & assertion-reasoning questions with detailed solutions</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="section faq-section">
        <div class="section-header">
          <span class="section-tag">FREQUENTLY ASKED QUESTIONS</span>
          <h2 class="section-heading">Got Questions? We Have Answers</h2>
        </div>

        <div class="faq-list">
          @for (faq of faqs(); track faq.question) {
            <div class="faq-item" [class.open]="faq.open" (click)="toggleFaq(faq)">
              <div class="faq-question-row">
                <h4>{{ faq.question }}</h4>
                <span class="faq-chevron">{{ faq.open ? '−' : '+' }}</span>
              </div>
              @if (faq.open) {
                <div class="faq-answer-body">
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
          <span class="cta-pill">⚡ START IN UNDER 30 SECONDS</span>
          <h2>Transform How You Test Knowledge Today</h2>
          <p>Join educators and self-learners building better, faster quizzes with Quizzy AI.</p>
          <div class="cta-buttons">
            <a routerLink="/auth/register" class="btn-hero-primary">Create Your First Quiz Free →</a>
            @if (authService.isAuthenticated()) {
              <a routerLink="/dashboard" class="btn-hero-secondary">Go to Dashboard</a>
            }
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-container">
          <div class="footer-brand">
            <div class="brand-logo">
              <div class="logo-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <span class="brand-title">Quizzy AI</span>
            </div>
            <p class="footer-tagline">AI-Powered Assessment & Certification Platform.</p>
          </div>

          <div class="footer-links-group">
            <a routerLink="/dashboard">Dashboard</a>
            <a routerLink="/quizzes/new">Create Quiz</a>
            <a routerLink="/verify-certificate">Verify Certificate</a>
            <a routerLink="/auth/login">Sign In</a>
            <a routerLink="/auth/register">Register</a>
          </div>

          <div class="footer-bottom-line">
            <p>© {{ currentYear }} Quizzy AI. All rights reserved.</p>
            <p class="privacy-note">🔒 Student assessments and answers are encrypted & private.</p>
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

    /* Container */
    .nav-container, .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      width: 100%;
    }

    /* Navbar */
    .landing-navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--nav-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-hairline);
      padding: 0.9rem 0;
      transition: background-color 0.2s ease;
    }
    .landing-navbar .nav-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }
    .logo-box {
      width: 36px;
      height: 36px;
      background: var(--color-primary-600);
      color: #ffffff;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
    }
    .brand-name-group {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-heading) !important;
      letter-spacing: -0.02em;
    }
    .brand-tag {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--color-primary-600);
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      padding: 0.15rem 0.4rem;
      border-radius: 9999px;
      text-transform: uppercase;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .theme-toggle-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      cursor: pointer;
      color: var(--text-heading);
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
      &:hover {
        background: var(--bg-hover);
        transform: scale(1.05);
      }
    }

    .btn-dashboard {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--color-primary-600);
      color: #ffffff !important;
      font-weight: 700;
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
      transition: all 0.2s ease;
      &:hover {
        background: var(--color-primary-700);
        transform: translateY(-1px);
      }
    }

    .btn-ghost {
      color: var(--text-heading) !important;
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-md);
      transition: background 0.2s ease;
      &:hover { background: var(--bg-hover); }
    }

    .btn-primary {
      background: var(--color-primary-600);
      color: #ffffff !important;
      font-size: 0.875rem;
      font-weight: 700;
      text-decoration: none;
      padding: 0.5rem 1.15rem;
      border-radius: var(--radius-md);
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
      transition: all 0.2s ease;
      &:hover {
        background: var(--color-primary-700);
        transform: translateY(-1px);
      }
    }

    /* Hero Section */
    .hero-section {
      position: relative;
      padding: 5rem 1.5rem 4rem 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .hero-glow {
      position: absolute;
      top: -50px;
      left: 50%;
      transform: translateX(-50%);
      width: 70vw;
      height: 450px;
      background: radial-gradient(ellipse at top, rgba(99, 102, 241, 0.16) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 860px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      color: var(--color-primary-700);
      padding: 0.35rem 0.9rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }

    .hero-title {
      font-size: clamp(2.3rem, 5.5vw, 4rem);
      font-weight: 800;
      color: var(--text-heading) !important;
      line-height: 1.15;
      letter-spacing: -0.035em;
      margin-bottom: 1.25rem;
    }

    .text-gradient {
      background: linear-gradient(135deg, var(--color-primary-600) 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: clamp(1rem, 2vw, 1.15rem);
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 680px;
      margin-bottom: 2.25rem;
    }

    .hero-cta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 2.5rem;
    }

    .btn-hero-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--color-primary-600);
      color: #ffffff !important;
      font-size: 1.05rem;
      font-weight: 700;
      padding: 0.85rem 2rem;
      border-radius: 9999px;
      text-decoration: none;
      box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      &:hover {
        background: var(--color-primary-700);
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(79, 70, 229, 0.45);
      }
    }

    .btn-hero-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-surface);
      color: var(--text-heading) !important;
      font-size: 1rem;
      font-weight: 600;
      padding: 0.85rem 1.85rem;
      border-radius: 9999px;
      border: 1px solid var(--border-strong);
      text-decoration: none;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
      &:hover {
        background: var(--bg-hover);
        transform: translateY(-1px);
      }
    }

    .trust-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* Product Mockup */
    .hero-visual {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 820px;
      margin-top: 3rem;
    }

    .glass-mockup {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(79, 70, 229, 0.06);
      text-align: left;
    }

    .mockup-header {
      background: var(--bg-hover);
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-hairline);
    }
    .window-controls {
      display: flex;
      gap: 0.4rem;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }
    .dot.green { background: #10b981; }

    .mockup-url {
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      font-weight: 800;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
    }

    .mockup-body {
      padding: 1.5rem;
    }

    .quiz-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      gap: 1rem;
    }
    .quiz-topic-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-primary-600);
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      padding: 0.15rem 0.55rem;
      border-radius: 9999px;
      margin-bottom: 0.35rem;
      text-transform: uppercase;
    }
    .quiz-preview-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text-heading) !important;
      margin: 0;
    }
    .quiz-timer {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--color-warning-bg);
      color: var(--color-warning-text);
      border: 1px solid var(--color-warning-border);
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1.25rem;
    }
    .progress-bar {
      height: 6px;
      background: var(--bg-hover);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      width: 25%;
      background: linear-gradient(90deg, var(--color-primary-600), #8b5cf6);
      border-radius: 9999px;
    }
    .progress-text {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .question-box {
      background: var(--bg-hover);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      padding: 1rem 1.2rem;
      margin-bottom: 1.2rem;
      display: flex;
      gap: 0.6rem;
    }
    .q-label {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-primary-600);
    }
    .q-content {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-heading);
      line-height: 1.45;
      margin: 0;
    }

    .options-container {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-bottom: 1.25rem;
    }
    .option-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.9rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-hairline);
      background: var(--bg-surface);
      font-size: 0.85rem;
      color: var(--text-body);
      transition: all 0.15s ease;
    }
    .opt-key {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1.5px solid var(--border-strong);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .opt-label {
      font-weight: 500;
      line-height: 1.35;
    }
    .selected-correct {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.08);
      color: var(--text-heading);
    }
    .correct-key {
      background: #10b981;
      border-color: #10b981;
      color: #ffffff;
    }
    .check-icon {
      margin-left: auto;
      stroke: #10b981;
      flex-shrink: 0;
    }

    .mockup-footer {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border-top: 1px solid var(--border-hairline);
      padding-top: 1rem;
    }
    .score-chip {
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-sm);
    }
    .score-chip.green {
      background: rgba(16, 185, 129, 0.12);
      color: #047857;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .badge-chip {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* Sections Shared Styling */
    .section {
      padding: 5rem 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .section-header {
      text-align: center;
      max-width: 720px;
      margin: 0 auto 3.5rem auto;
    }
    .section-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--color-primary-600);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 0.5rem;
      display: block;
    }
    .section-heading {
      font-size: clamp(1.8rem, 3.5vw, 2.5rem);
      font-weight: 800;
      color: var(--text-heading) !important;
      letter-spacing: -0.025em;
      line-height: 1.2;
      margin-bottom: 0.85rem;
    }
    .section-description {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.75rem;
    }
    .feature-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      &:hover {
        transform: translateY(-3px);
        border-color: var(--color-primary-300);
        box-shadow: var(--shadow-md);
      }
    }
    .feat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      margin-bottom: 1.25rem;
    }
    .bg-indigo { background: var(--color-primary-50); color: var(--color-primary-600); }
    .bg-emerald { background: rgba(16, 185, 129, 0.12); color: #10b981; }
    .bg-blue { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
    .bg-purple { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
    .bg-amber { background: var(--color-warning-bg); color: var(--color-warning-text); }
    .bg-rose { background: rgba(244, 63, 94, 0.12); color: #f43f5e; }

    .feature-card h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-heading) !important;
      margin-bottom: 0.6rem;
    }
    .feature-card p {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
    .code-pill {
      font-family: monospace;
      font-size: 0.8rem;
      background: var(--bg-hover);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      color: var(--color-primary-600);
    }

    /* Workflow Steps */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.75rem;
    }
    .step-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      padding: 2.25rem 2rem;
      position: relative;
    }
    .step-number {
      font-family: var(--font-heading);
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--color-primary-200);
      line-height: 1;
      margin-bottom: 1rem;
    }
    .step-card h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-heading) !important;
      margin-bottom: 0.65rem;
    }
    .step-card p {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* Roles */
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.75rem;
    }
    .role-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-xl);
      padding: 2.25rem;
      display: flex;
      flex-direction: column;
    }
    .role-card.highlight-role {
      border-color: var(--color-primary-500);
      box-shadow: 0 8px 30px rgba(79, 70, 229, 0.12);
    }
    .role-card.govt-role-card {
      border-color: #F59E0B;
      box-shadow: 0 8px 30px rgba(245, 158, 11, 0.12);
    }
    .role-badge {
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--color-primary-600);
      margin-bottom: 0.75rem;
      letter-spacing: 0.05em;
    }
    .role-badge.badge-amber {
      color: #D97706 !important;
    }
    .role-card h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-heading) !important;
      margin-bottom: 0.75rem;
    }
    .role-card p {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 1.25rem;
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
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-body);
    }

    /* FAQ */
    .faq-list {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .faq-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      cursor: pointer;
      transition: border-color 0.2s ease, background-color 0.2s ease;
      &:hover { border-color: var(--color-primary-300); }
      &.open { border-color: var(--color-primary-500); background: var(--bg-hover); }
    }
    .faq-question-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .faq-question-row h4 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-heading) !important;
      margin: 0;
    }
    .faq-chevron {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-primary-600);
      line-height: 1;
    }
    .faq-answer-body {
      margin-top: 0.85rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--border-hairline);
    }
    .faq-answer-body p {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin: 0;
    }

    /* Bottom CTA */
    .bottom-cta {
      padding: 3rem 1.5rem 6rem 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
      width: 100%;
    }
    .cta-inner {
      background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-hover) 100%);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-2xl);
      padding: 4rem 2rem;
      text-align: center;
      box-shadow: var(--shadow-md);
    }
    .cta-pill {
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--color-primary-600);
      letter-spacing: 0.08em;
      margin-bottom: 0.75rem;
      display: inline-block;
    }
    .cta-inner h2 {
      font-size: clamp(1.8rem, 4vw, 2.5rem);
      font-weight: 800;
      color: var(--text-heading) !important;
      margin-bottom: 0.85rem;
      letter-spacing: -0.025em;
    }
    .cta-inner p {
      font-size: 1.05rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
    }
    .cta-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    /* Footer */
    .landing-footer {
      background: var(--bg-surface);
      border-top: 1px solid var(--border-hairline);
      padding: 3.5rem 0 2rem 0;
      margin-top: auto;
    }
    .footer-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .footer-tagline {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .footer-links-group {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .footer-links-group a {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-body);
      text-decoration: none;
      transition: color 0.2s ease;
      &:hover { color: var(--color-primary-600); }
    }
    .footer-bottom-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      border-top: 1px solid var(--border-hairline);
      padding-top: 1.5rem;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .privacy-note {
      color: var(--text-muted);
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .hero-section { padding: 3.5rem 1.25rem 3rem 1.25rem; }
      .hero-cta { flex-direction: column; width: 100%; }
      .btn-hero-primary, .btn-hero-secondary { width: 100%; justify-content: center; }
      .trust-row { gap: 1rem; }
      .btn-ghost { display: none; }
      .quiz-top-bar { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
      .footer-bottom-line { flex-direction: column; text-align: center; }
    }
  `]
})
export class LandingComponent {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly currentYear = new Date().getFullYear();

  readonly faqs = signal<FaqItem[]>([
    {
      question: 'How does Quizzy AI generate quizzes?',
      answer: 'Quizzy AI uses ultra-fast Groq LLMs (such as Llama 3 & Mixtral) to analyze any subject, prompt, or topic you provide. It automatically generates high-quality multiple-choice questions with 4 distinct options, accurate answer keys, and clear explanations.',
      open: true
    },
    {
      question: 'How many students can take a quiz at the same time?',
      answer: 'Quizzy AI easily supports 15, 20, 30, 50, and up to hundreds of concurrent students. Our lightweight architecture and distributed API handle peak classroom submissions smoothly without server lag.',
      open: false
    },
    {
      question: 'Can I choose the number of questions and difficulty level?',
      answer: 'Yes! You can choose quick presets (10, 15, 20, 30, 50 questions) or enter any custom count up to 50. You can also set the difficulty to Easy, Medium, or Hard, or provide specific custom guidelines in the prompt.',
      open: false
    },
    {
      question: 'Do students need to create an account to take a test?',
      answer: 'No! When an educator creates a quiz and shares the link (e.g. /q/yourQuizId), students can click and start taking the quiz immediately on phone, tablet, or laptop without needing to register.',
      open: false
    },
    {
      question: 'How do students get their certificates?',
      answer: 'If the educator enables certificates and the student achieves the passing percentage (default 70%), Quizzy AI automatically issues an official digital diploma with a verifiable unique QR code and certificate ID.',
      open: false
    },
    {
      question: 'Is student assessment data private and secure?',
      answer: 'Yes, all assessment responses and scores are encrypted with TLS in transit and stored securely in dedicated tenant workspaces. Scores are accessible only to the test taker and the quiz creator.',
      open: false
    },
    {
      question: 'Can I prepare for government and competitive exams (UPSC, SSC, Banking, Railways, Defence) on Quizzy AI?',
      answer: 'Yes! Quizzy AI features a dedicated Government & Competitive Exam Hub covering UPSC Civil Services, SSC CGL/CHSL, Banking (IBPS/SBI PO), Railways RRB, Defence (NDA/CDS), CTET, and NEET/JEE. It includes official negative marking penalty configurations (-0.25, -0.33, -0.50, -1.0) and generates standard PYQ-style multi-statement and assertion-reasoning questions with comprehensive explanations.',
      open: false
    }
  ]);

  toggleFaq(faq: FaqItem): void {
    faq.open = !faq.open;
  }
}

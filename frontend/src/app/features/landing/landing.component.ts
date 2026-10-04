import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page">
      <!-- Transparent Navbar -->
      <nav class="landing-navbar">
        <div class="nav-container">
          <a routerLink="/" class="brand-logo">
            <div class="logo-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <span class="brand-title">QuizPulse</span>
          </a>
          <div class="nav-actions" style="display: flex; align-items: center; gap: 1rem;">
            <button (click)="themeService.toggleTheme()" class="theme-toggle-btn" style="background: transparent; border: none; font-size: 1.25rem; cursor: pointer; color: var(--l-text); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%;" [title]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
              {{ themeService.isDarkMode() ? '☀️' : '🌙' }}
            </button>
            @if (authService.isAuthenticated()) {
              <a routerLink="/dashboard" class="btn-primary-outline">Go to Dashboard</a>
            } @else {
              <a routerLink="/auth/login" class="btn-ghost">Sign In</a>
              <a routerLink="/auth/register" class="btn-primary">Get Started Free</a>
            }
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="badge-pill floating-animation-slow">
            <span class="pulse-dot"></span> Powered by Groq AI — Ultra Fast Generation
          </div>
          <h1 class="hero-title fade-in-up">
            Next-Generation <br />
            <span class="text-gradient">AI Quiz Platform</span>
          </h1>
          <p class="hero-subtitle fade-in-up delay-1">
            Generate complex assessments in seconds, track student progress in real-time, and issue verified digital certificates automatically.
          </p>
          <div class="hero-cta fade-in-up delay-2">
            @if (authService.isAuthenticated()) {
              <a routerLink="/dashboard" class="btn-hero-primary">Enter Dashboard 
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
            } @else {
              <a routerLink="/auth/register" class="btn-hero-primary">Start Creating for Free
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <a routerLink="/auth/login" class="btn-hero-secondary">Sign In</a>
            }
          </div>
          <!-- Social Proof -->
          <div class="social-proof fade-in-up delay-3">
            <div class="proof-avatars">
              <div class="proof-avatar" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">S</div>
              <div class="proof-avatar" style="background: linear-gradient(135deg, #10b981, #059669)">R</div>
              <div class="proof-avatar" style="background: linear-gradient(135deg, #f59e0b, #d97706)">A</div>
              <div class="proof-avatar" style="background: linear-gradient(135deg, #ef4444, #dc2626)">K</div>
            </div>
            <span class="proof-text">Join <strong>500+</strong> educators already using QuizPulse</span>
          </div>
        </div>
        
        <!-- Hero Visual / Rich Product Mockup -->
        <div class="hero-visual fade-in-up delay-3">
          <!-- Floating Stat Chips -->
          <div class="floating-chip chip-top-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Quiz generated in <strong>2.1s</strong></span>
          </div>
          <div class="floating-chip chip-top-right">
            <span>⚡</span>
            <span><strong>50</strong> questions</span>
          </div>
          
          <!-- Main Mockup Card -->
          <div class="glass-mockup">
            <div class="mockup-header">
              <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
              <span class="mockup-url">quizpulse.app / quiz / advanced-physics</span>
            </div>
            <div class="mockup-body">
              <!-- Quiz Header -->
              <div class="quiz-header-bar">
                <div class="quiz-info">
                  <span class="quiz-tag">⚡ AI Generated</span>
                  <h4 class="quiz-name">Advanced Physics — Quantum Mechanics</h4>
                </div>
                <div class="timer-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  14:32
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="quiz-progress-wrap">
                <div class="quiz-progress-bar">
                  <div class="quiz-progress-fill slide-right"></div>
                </div>
                <span class="progress-label">Question 7 of 25</span>
              </div>

              <!-- Question Card -->
              <div class="question-card">
                <p class="question-number">Q7.</p>
                <p class="question-text">According to Heisenberg's uncertainty principle, which pair of physical properties cannot be simultaneously measured with arbitrary precision?</p>
              </div>

              <!-- Answer Options -->
              <div class="options-list">
                <div class="option-item">
                  <span class="option-letter">A</span>
                  <span>Mass and velocity</span>
                </div>
                <div class="option-item selected">
                  <span class="option-letter selected-letter">B</span>
                  <span>Position and momentum</span>
                  <svg class="option-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div class="option-item">
                  <span class="option-letter">C</span>
                  <span>Energy and temperature</span>
                </div>
                <div class="option-item">
                  <span class="option-letter">D</span>
                  <span>Charge and spin</span>
                </div>
              </div>

              <!-- Score Stats Row -->
              <div class="stats-row">
                <div class="stat-pill green">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  6 Correct
                </div>
                <div class="stat-pill blue">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line></svg>
                  Score: 86%
                </div>
                <div class="stat-pill purple">
                  📜 Auto-certificate
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom floating chip -->
          <div class="floating-chip chip-bottom">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
            <span>Certificate auto-issued on pass</span>
          </div>
        </div>
      </section>


      <!-- Features Section -->
      <section class="features-section">
        <h2 class="section-title">Everything you need to <span class="text-highlight">assess knowledge</span></h2>
        
        <div class="features-grid">
          <div class="feature-card hover-lift">
            <div class="feature-icon bg-purple">⚡</div>
            <h3>Lightning Fast AI</h3>
            <p>Leverage the extreme speed of Groq LLMs to generate 50-question quizzes complete with options and correct answers instantly.</p>
          </div>
          
          <div class="feature-card hover-lift">
            <div class="feature-icon bg-emerald">📜</div>
            <h3>Verified Certificates</h3>
            <p>Automatically issue beautiful, custom-branded certificates with unique QR verification codes for passing students.</p>
          </div>
          
          <div class="feature-card hover-lift">
            <div class="feature-icon bg-blue">📊</div>
            <h3>Real-time Analytics</h3>
            <p>Monitor student progress, identify weak points, and view automated leaderboards as soon as tests are submitted.</p>
          </div>
          
          <div class="feature-card hover-lift">
            <div class="feature-icon bg-orange">📱</div>
            <h3>Adaptive Player</h3>
            <p>Deliver tests on any device with a distraction-free, highly responsive interface and automated time limits.</p>
          </div>
        </div>
      </section>

      <!-- Footer CTA -->
      <section class="bottom-cta-section">
        <div class="cta-card">
          <h2>Ready to transform your assessments?</h2>
          <p>Join educators and trainers saving hours of work every week with QuizPulse.</p>
          <a routerLink="/auth/register" class="btn-hero-primary mt-4">Create Your First Quiz →</a>
        </div>
      </section>
      
      <!-- Minimal Footer -->
      <footer class="landing-footer">
        <div class="nav-container footer-flex">
          <div class="brand-logo mb-0">
            <div class="logo-box small-logo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <span class="brand-title" style="font-size: 1rem;">QuizPulse</span>
          </div>
          <p class="copyright">© {{ currentYear }} QuizPulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    /* Core Variables for Landing */
    :host {
      --l-bg: var(--bg-app);
      --l-surface: var(--bg-surface);
      --l-text: var(--text-heading);
      --l-text-muted: var(--text-secondary);
      --l-primary: var(--color-primary-600);
      --l-primary-hover: var(--color-primary-700);
      --l-gradient-1: var(--color-ai-start);
      --l-gradient-2: var(--color-ai-end);
    }

    .landing-page {
      background-color: var(--l-bg);
      color: var(--l-text);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Override global !important heading colors for the landing page */
    .landing-page h1, 
    .landing-page h2, 
    .landing-page h3, 
    .landing-page h4 {
      color: var(--l-text) !important;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      width: 100%;
    }

    /* Navbar */
    .landing-navbar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      padding: 1.25rem 0;
      z-index: 100;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-hairline);
      background: var(--nav-bg);
    }
    .landing-navbar .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--text-heading) !important;
    }
    .logo-box {
      width: 32px;
      height: 32px;
      background: var(--color-primary-600);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .logo-box.small-logo { width: 24px; height: 24px; border-radius: var(--radius-sm); }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .mb-0 { margin-bottom: 0 !important; }

    .nav-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    /* Buttons */
    .btn-ghost {
      color: var(--text-heading);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      transition: background 0.2s ease;
    }
    .btn-ghost:hover {
      background: var(--bg-hover);
    }
    .btn-primary {
      background: var(--color-primary-600);
      color: white !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 0.6rem 1.25rem;
      border-radius: var(--radius-md);
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      background: var(--color-primary-700);
      box-shadow: var(--shadow-sm);
    }
    .btn-primary-outline {
      border: 1px solid var(--border-strong);
      color: var(--text-heading) !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 0.6rem 1.25rem;
      border-radius: var(--radius-md);
      transition: background 0.2s ease;
    }
    .btn-primary-outline:hover {
      background: var(--bg-hover);
    }

    .btn-hero-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--color-primary-600);
      color: white !important;
      text-decoration: none;
      font-size: 1.1rem;
      font-weight: 700;
      padding: 0.95rem 2.25rem;
      border-radius: 9999px;
      box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .btn-hero-primary:hover {
      transform: translateY(-3px) scale(1.02);
      background: var(--color-primary-700);
      box-shadow: 0 15px 35px rgba(79, 70, 229, 0.4);
    }
    .btn-hero-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-surface);
      color: var(--text-heading) !important;
      text-decoration: none;
      font-size: 1rem;
      font-weight: 600;
      padding: 0.9rem 2rem;
      border-radius: 9999px;
      border: 1px solid var(--border-strong);
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
    }
    .btn-hero-secondary:hover {
      background: var(--bg-hover);
      transform: translateY(-2px);
    }
    .hero-cta { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; justify-content: center; }
    .mt-4 { margin-top: 1.5rem; }

    /* Hero Section */
    .hero-section {
      position: relative;
      padding: 9rem 1.5rem 4rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 1280px;
      margin: 0 auto;
    }
    .hero-glow {
      position: absolute;
      top: -10%;
      left: 50%;
      transform: translateX(-50%);
      width: 80vw;
      height: 600px;
      background: radial-gradient(ellipse at top, rgba(99, 102, 241, 0.18) 0%, transparent 65%);
      z-index: 0;
      pointer-events: none;
    }
    .hero-content {
      position: relative;
      z-index: 10;
      max-width: 820px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Social Proof */
    .social-proof {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 2rem;
    }
    .proof-avatars {
      display: flex;
    }
    .proof-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--bg-surface);
      margin-left: -6px;
    }
    .proof-avatar:first-child { margin-left: 0; }
    .proof-text {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .proof-text strong { color: var(--text-heading); }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 1rem;
      background: var(--color-primary-50);
      border: 1px solid var(--border-hairline);
      border-radius: 9999px;
      color: var(--color-primary-600);
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 1.5rem;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: var(--color-primary-600);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--color-primary-200);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 var(--color-primary-200); }
      70% { box-shadow: 0 0 0 6px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }

    .hero-title {
      font-size: clamp(2.5rem, 8vw, 5rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.04em;
      margin: 0 0 1.25rem 0;
    }
    .text-gradient {
      background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-ai-purple) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: var(--color-primary-600); /* Fallback */
    }
    .hero-subtitle {
      font-size: clamp(1.1rem, 2vw, 1.25rem);
      color: var(--l-text-muted);
      line-height: 1.6;
      max-width: 600px;
      margin: 0 0 2.5rem 0;
    }

    /* Hero Mockup — Rich Product Preview */
    .hero-visual {
      margin-top: 3.5rem;
      width: 100%;
      max-width: 760px;
      position: relative;
      z-index: 10;
    }

    /* Floating chips */
    .floating-chip {
      position: absolute;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 9999px;
      padding: 0.45rem 0.9rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-body);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      box-shadow: var(--shadow-md);
      z-index: 20;
      white-space: nowrap;
      animation: float 4s ease-in-out infinite;
    }
    .chip-top-left { top: -18px; left: -10px; animation-delay: 0s; }
    .chip-top-right { top: -18px; right: 20px; animation-delay: 1s; }
    .chip-bottom { bottom: -18px; left: 50%; transform: translateX(-50%); animation-delay: 2s; }

    .glass-mockup {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-2xl);
      overflow: hidden;
      box-shadow: 0 30px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(99,102,241,0.08);
    }
    .mockup-header {
      background: var(--bg-hover);
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-hairline);
    }
    .mockup-header .dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }
    .dot.green { background: #10b981; }
    .mockup-url {
      margin-left: 0.5rem;
      font-size: 0.72rem;
      color: var(--text-muted);
      font-family: monospace;
    }

    .mockup-body { padding: 1.5rem; text-align: left; }

    /* Quiz header bar */
    .quiz-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      gap: 1rem;
    }
    .quiz-info { flex: 1; }
    .quiz-tag {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-primary-600);
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      border-radius: 9999px;
      padding: 0.2rem 0.6rem;
      margin-bottom: 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .quiz-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-heading);
      margin: 0;
    }
    .timer-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-warning-text);
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning-border);
      padding: 0.3rem 0.7rem;
      border-radius: 9999px;
      flex-shrink: 0;
    }

    /* Progress */
    .quiz-progress-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .quiz-progress-bar {
      flex: 1;
      height: 5px;
      background: var(--bg-hover);
      border-radius: 9999px;
      overflow: hidden;
    }
    .quiz-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary-600), var(--color-ai-purple));
      border-radius: 9999px;
      width: 28%;
    }
    .progress-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      white-space: nowrap;
      font-weight: 600;
    }

    /* Question */
    .question-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
    }
    .question-number { font-size: 0.75rem; font-weight: 700; color: var(--color-primary-600); margin: 0 0 0.3rem 0; }
    .question-text { font-size: 0.85rem; color: var(--text-heading); margin: 0; line-height: 1.55; font-weight: 500; }

    /* Options */
    .options-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
    .option-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.85rem;
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      color: var(--text-body);
      cursor: pointer;
      background: var(--bg-surface);
      transition: all 0.15s ease;
    }
    .option-item.selected {
      border-color: var(--color-primary-600);
      background: var(--color-primary-50);
      color: var(--color-primary-700);
      font-weight: 600;
    }
    .option-letter {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 1.5px solid var(--border-strong);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      flex-shrink: 0;
      color: var(--text-muted);
    }
    .selected-letter {
      background: var(--color-primary-600);
      border-color: var(--color-primary-600);
      color: white;
    }
    .option-check { margin-left: auto; stroke: var(--color-primary-600); }

    /* Stats Row */
    .stats-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.7rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .stat-pill.green { background: var(--color-success-bg); color: var(--color-success-text); border: 1px solid var(--color-success-border); }
    .stat-pill.blue { background: rgba(59,130,246,0.1); color: #2563eb; border: 1px solid rgba(59,130,246,0.2); }
    .stat-pill.purple { background: var(--color-ai-bg); color: var(--color-ai-purple); border: 1px solid var(--color-ai-border); }


    /* Features Section */
    .features-section {
      padding: 6rem 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .section-title {
      font-size: 2.5rem;
      font-weight: 800;
      text-align: center;
      margin-bottom: 4rem;
      letter-spacing: -0.02em;
    }
    .text-highlight {
      color: var(--color-primary-600);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }
    .feature-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 1.25rem;
      padding: 2.25rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
    }
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
      border-color: var(--color-primary-300);
    }
    .feature-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .bg-purple { background: var(--color-primary-50); color: var(--color-primary-600); }
    .bg-emerald { background: var(--color-success-bg); color: var(--color-success-text); }
    .bg-blue { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
    .bg-orange { background: var(--color-warning-bg); color: var(--color-warning-text); }

    .feature-card h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .feature-card p {
      color: var(--l-text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0;
    }

    /* Bottom CTA */
    .bottom-cta-section {
      padding: 4rem 1.5rem 8rem 1.5rem;
      display: flex;
      justify-content: center;
    }
    .cta-card {
      background: var(--bg-hover);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg);
      padding: 4rem 2rem;
      text-align: center;
      max-width: 800px;
      width: 100%;
    }
    .cta-card h2 { font-size: 2.25rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -0.02em; }
    .cta-card p { color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 2rem; }

    /* Footer */
    .landing-footer {
      border-top: 1px solid var(--border-hairline);
      padding: 2rem 0;
      background: var(--bg-surface);
      margin-top: auto;
    }
    .footer-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .copyright {
      color: var(--l-text-muted);
      font-size: 0.85rem;
      margin: 0;
    }

    /* Animations */
    .hover-lift { transition: transform 0.3s ease; }
    .hover-lift:hover { transform: translateY(-5px); }
    
    .floating-animation-slow { animation: float 6s ease-in-out infinite; }
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }

    .fade-in-up {
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
      transform: translateY(20px);
    }
    .delay-1 { animation-delay: 0.15s; }
    .delay-2 { animation-delay: 0.3s; }
    .delay-3 { animation-delay: 0.45s; }
    
    @keyframes fadeInUp {
      to { opacity: 1; transform: translateY(0); }
    }

    .slide-right {
      animation: slideRight 2s ease-out forwards;
      width: 0 !important;
    }
    @keyframes slideRight {
      to { width: 28% !important; }
    }

    /* Mobile */
    @media (max-width: 768px) {
      .hero-title { font-size: 2.75rem; }
      .hero-section { padding: 7rem 1.25rem 4rem 1.25rem; }
      .btn-ghost { display: none; }
      .footer-flex { flex-direction: column; gap: 1rem; text-align: center; }
      .btn-primary-outline { padding: 0.5rem 0.85rem; font-size: 0.85rem; }
      .nav-actions { gap: 0.5rem; }
      .theme-toggle-btn { width: 32px !important; height: 32px !important; font-size: 1rem !important; }
      .btn-hero-primary { padding: 0.85rem 1.5rem; font-size: 1rem; }
      .btn-hero-secondary { padding: 0.75rem 1.25rem; font-size: 0.9rem; }
      .badge-pill { padding: 0.25rem 0.75rem; font-size: 0.7rem; }
      .floating-chip { display: none; } /* hide floating chips on mobile for cleaner look */
      .social-proof { flex-direction: column; gap: 0.5rem; }
    }
    
    @media (max-width: 480px) {
      .hero-title { font-size: 2.25rem; }
      .hero-subtitle { font-size: 1rem; }
      .mockup-body { padding: 1rem; }
      .section-title { font-size: 2rem; }
      .quiz-name { font-size: 0.85rem; }
      .question-text { font-size: 0.8rem; }
      .hero-cta { flex-direction: column; align-items: stretch; }
      .btn-hero-primary, .btn-hero-secondary { justify-content: center; }
    }
  `]
})
export class LandingComponent implements OnInit {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    // Component initialization
  }
}

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
            <span class="pulse-dot"></span> Powered by Groq AI
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
            }
          </div>
        </div>
        
        <!-- Hero Visual / Mockup -->
        <div class="hero-visual fade-in-up delay-3">
          <div class="glass-mockup">
            <div class="mockup-header">
              <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
            </div>
            <div class="mockup-body">
              <div class="mockup-title">Generating Assessment: "Advanced Physics"</div>
              <div class="mockup-progress">
                <div class="progress-bar-fill slide-right"></div>
              </div>
              <div class="mockup-lines">
                <div class="line w-80"></div>
                <div class="line w-60"></div>
                <div class="line w-90"></div>
              </div>
            </div>
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
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .btn-hero-primary:hover {
      transform: translateY(-3px) scale(1.02);
      background: var(--color-primary-700);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
    }
    .mt-4 { margin-top: 1.5rem; }

    /* Hero Section */
    .hero-section {
      position: relative;
      padding: 10rem 1.5rem 6rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    .hero-glow {
      position: absolute;
      top: -10%;
      left: 50%;
      transform: translateX(-50%);
      width: 60vw;
      height: 500px;
      background: radial-gradient(circle at top, var(--color-primary-200) 0%, transparent 60%);
      z-index: 0;
      pointer-events: none;
      opacity: 0.3;
    }
    .hero-content {
      position: relative;
      z-index: 10;
      max-width: 800px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

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
      font-size: clamp(3rem, 6vw, 5rem);
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

    /* Glass Mockup */
    .hero-visual {
      margin-top: 4rem;
      width: 100%;
      max-width: 700px;
      position: relative;
      z-index: 10;
    }
    .glass-mockup {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }
    .mockup-header {
      background: var(--bg-hover);
      padding: 0.75rem 1rem;
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-hairline);
    }
    .mockup-header .dot {
      width: 10px; height: 10px; border-radius: 50%;
    }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }
    .dot.green { background: #10b981; }
    
    .mockup-body {
      padding: 2rem;
      text-align: left;
    }
    .mockup-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: var(--text-heading);
    }
    .mockup-progress {
      height: 6px;
      background: var(--bg-hover);
      border-radius: var(--radius-sm);
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: var(--color-primary-600);
      width: 70%;
      border-radius: var(--radius-sm);
    }
    .mockup-lines {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .line { height: 12px; background: var(--bg-hover); border-radius: var(--radius-sm); }
    .w-80 { width: 80%; } .w-60 { width: 60%; } .w-90 { width: 90%; }

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
      width: 0;
    }
    @keyframes slideRight {
      to { width: 70%; }
    }

    /* Mobile */
    @media (max-width: 768px) {
      .hero-title { font-size: 2.5rem; }
      .hero-section { padding-top: 8rem; }
      .btn-ghost { display: none; }
      .footer-flex { flex-direction: column; gap: 1rem; text-align: center; }
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

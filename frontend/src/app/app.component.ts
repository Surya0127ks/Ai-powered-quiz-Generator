import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { UserRole } from './core/models/auth.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (!hideLayout()) {
      <header class="qp-navbar no-print">
        <div class="nav-container">
          <!-- Brand Logo -->
          <a routerLink="/dashboard" class="brand-logo" (click)="mobileMenuOpen.set(false)">
            <div class="logo-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <span class="brand-title">QuizPulse</span>
          </a>

          <!-- Desktop Nav Links -->
          <nav class="nav-menu">
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
              <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dashboard</span>
            </a>

            @if (authService.isAuthenticated()) {
              <a routerLink="/quizzes/new" routerLinkActive="active" class="nav-link">
                <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
                <span>Create Quiz</span>
              </a>

              <a routerLink="/student/progress" routerLinkActive="active" class="nav-link">
                <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20v-6M6 20V10M18 20V4"></path>
                </svg>
                <span>Attempt History</span>
              </a>

              <a routerLink="/certificate/generator" routerLinkActive="active" class="nav-link">
                <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="7"></circle>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
                <span>Certificates</span>
              </a>
            }
          </nav>

          <!-- Right: Account, Theme Toggle & AI CTA -->
          <div class="nav-right">
            <!-- Light / Dark Theme Switcher Button -->
            <button
              (click)="themeService.toggleTheme()"
              class="theme-toggle-btn"
              [title]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            >
              {{ themeService.isDarkMode() ? '☀️' : '🌙' }}
            </button>

            @if (authService.isAuthenticated()) {
              <a routerLink="/quizzes/new" class="btn btn-ai btn-sm desktop-only">
                ✨ Create with AI
              </a>

              <div class="user-chip desktop-only">
                <div class="avatar-circle">
                  {{ authService.currentUser()?.firstName?.charAt(0) || 'U' }}
                </div>
                <div class="user-meta">
                  <span class="user-name">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</span>
                  <span class="user-role">{{ getRoleName(authService.currentUser()?.role) }}</span>
                </div>
              </div>

              <button (click)="onLogout()" class="btn btn-outline btn-sm desktop-only">Sign Out</button>
            } @else {
              <a routerLink="/auth/login" class="btn btn-outline btn-sm desktop-only">Sign In</a>
              <a routerLink="/auth/register" class="btn btn-primary btn-sm desktop-only">Get Started</a>
            }

            <!-- Mobile Hamburger Button -->
            <button (click)="mobileMenuOpen.set(!mobileMenuOpen())" class="mobile-toggle-btn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                @if (mobileMenuOpen()) {
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                } @else {
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                }
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Collapsible Drawer Navigation Menu -->
        @if (mobileMenuOpen()) {
          <div class="mobile-drawer-menu">
            <a routerLink="/dashboard" (click)="mobileMenuOpen.set(false)" class="mobile-nav-item">
              <span>🏠 Dashboard</span>
            </a>
            @if (authService.isAuthenticated()) {
              <a routerLink="/quizzes/new" (click)="mobileMenuOpen.set(false)" class="mobile-nav-item highlight-ai">
                <span>✨ Create Quiz with AI</span>
              </a>
              <a routerLink="/student/progress" (click)="mobileMenuOpen.set(false)" class="mobile-nav-item">
                <span>📊 Attempt History & Score Reports</span>
              </a>
              <a routerLink="/certificate/generator" (click)="mobileMenuOpen.set(false)" class="mobile-nav-item">
                <span>📜 Certificate Studio</span>
              </a>
              <div class="mobile-user-profile">
                <div class="avatar-circle">
                  {{ authService.currentUser()?.firstName?.charAt(0) || 'U' }}
                </div>
                <div class="user-meta">
                  <span class="user-name">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</span>
                  <span class="user-role">{{ getRoleName(authService.currentUser()?.role) }}</span>
                </div>
              </div>
              <button (click)="onLogout(); mobileMenuOpen.set(false)" class="btn btn-danger btn-sm width-full margin-top-xs">
                Sign Out
              </button>
            } @else {
              <a routerLink="/auth/login" (click)="mobileMenuOpen.set(false)" class="mobile-nav-item">
                <span>Sign In</span>
              </a>
              <a routerLink="/auth/register" (click)="mobileMenuOpen.set(false)" class="mobile-nav-item highlight-ai">
                <span>Create Account</span>
              </a>
            }
          </div>
        }
      </header>
    }

    <!-- Main View Outlet -->
    <main class="app-main-layout">
      <router-outlet></router-outlet>
    </main>

    <!-- Adaptive Footer (Pure White in Day Mode, Dark Slate in Dark Mode) -->
    @if (!hideLayout()) {
      <footer class="qp-footer">
        <div class="footer-container">
          <div class="footer-grid">
            <!-- Col 1: Brand & Tagline -->
            <div class="footer-brand-col">
              <div class="brand-logo mb-2">
                <div class="logo-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <span class="brand-title brand-title-footer">QuizPulse</span>
              </div>
              <p class="brand-desc">
                Empowering students, educators, and organizations with Groq AI quiz creation, instant scoring, and verified digital certificates.
              </p>
              <div class="ai-badge-row">
                <span class="badge badge-ai-footer">⚡ Powered by Groq LLM</span>
              </div>
            </div>

            <!-- Col 2: Navigation Links -->
            <div class="footer-col">
              <h5 class="footer-heading">Platform</h5>
              <ul class="footer-links">
                <li><a routerLink="/dashboard">Dashboard</a></li>
                <li><a routerLink="/quizzes/new">✨ Create Quiz with AI</a></li>
                <li><a routerLink="/student/progress">Attempt History</a></li>
                <li><a routerLink="/certificate/generator">Certificate Studio</a></li>
                <li><a routerLink="/verify-certificate">Verify Certificate</a></li>
              </ul>
            </div>

            <!-- Col 3: Assessment Topics -->
            <div class="footer-col">
              <h5 class="footer-heading">Assessment Topics</h5>
              <ul class="footer-links">
                <li><a routerLink="/quizzes/new" [queryParams]="{topic: 'Artificial Intelligence & Groq LLM'}">Artificial Intelligence</a></li>
                <li><a routerLink="/quizzes/new" [queryParams]="{topic: 'Full-Stack Web Development'}">Web Development</a></li>
                <li><a routerLink="/quizzes/new" [queryParams]="{topic: 'Data Structures & Algorithms'}">Algorithms & Code</a></li>
                <li><a routerLink="/quizzes/new" [queryParams]="{topic: 'Cyber Security & Cloud'}">Cyber Security</a></li>
              </ul>
            </div>

            <!-- Col 4: Trust & Compliance -->
            <div class="footer-col">
              <h5 class="footer-heading">Features</h5>
              <ul class="footer-links">
                <li><span>🔒 SSL Encrypted</span></li>
                <li><span>📜 Custom Diplomas</span></li>
                <li><span>⚡ Instant Auto-Grading</span></li>
                <li><span>🎯 Shareable Links</span></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom-bar">
            <p>© 2026 QuizPulse Inc. All rights reserved.</p>
            <div class="footer-bottom-links">
              <a routerLink="/verify-certificate">Certificate Verification</a>
              <span>·</span>
              <a href="javascript:void(0)">Privacy Policy</a>
              <span>·</span>
              <a href="javascript:void(0)">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    }
  `,
  styles: [`
    .qp-navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 64px;
      background: var(--nav-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--nav-border);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: center;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    .nav-container {
      width: 100%;
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    /* Brand */
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      flex-shrink: 0;
    }
    .logo-box {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-md);
      background: var(--color-primary-600);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
    }
    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary) !important;
      letter-spacing: -0.02em;
    }

    /* Desktop Nav Links */
    .nav-menu {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.75rem;
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--text-secondary) !important;
      font-size: 0.875rem;
      font-weight: 600;
      white-space: nowrap;
      transition: all 0.15s ease;
      span { color: inherit !important; }
      .nav-svg { width: 18px; height: 18px; stroke: var(--text-muted); transition: stroke 0.15s ease; }

      &:hover {
        background-color: var(--bg-hover);
        color: var(--text-primary) !important;
        .nav-svg { stroke: var(--color-primary-600); }
      }

      &.active {
        background-color: var(--color-primary-50);
        color: var(--color-primary-600) !important;
        font-weight: 700;
        .nav-svg { stroke: var(--color-primary-600); }
      }
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Theme Toggle Switcher Button */
    .theme-toggle-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.05rem;
      transition: all 0.15s ease;
      &:hover {
        transform: scale(1.05);
        background: var(--color-primary-50);
        border-color: var(--color-primary-200);
      }
    }

    /* User Profile Chip */
    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.35rem 0.75rem 0.35rem 0.35rem;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
    }
    .avatar-circle {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: var(--color-primary-600);
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
      .user-name { font-size: 0.825rem; font-weight: 700; color: var(--text-primary) !important; }
      .user-role { font-size: 0.7rem; color: var(--text-muted) !important; font-weight: 500; }
    }

    /* Mobile Hamburger & Drawer Menu */
    .mobile-toggle-btn {
      display: none;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-primary);
      padding: 0.35rem;
    }

    .mobile-drawer-menu {
      position: absolute;
      top: 64px;
      left: 0;
      right: 0;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-hairline);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      padding: 1.0rem 1.5rem 1.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      z-index: 1000;
    }
    .mobile-nav-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1.0rem;
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--text-primary) !important;
      font-weight: 600;
      font-size: 0.95rem;
      background: var(--bg-hover);
      &:hover { background: var(--color-primary-50); color: var(--color-primary-600) !important; }
    }
    .mobile-nav-item.highlight-ai {
      background: var(--color-ai-bg);
      color: var(--color-ai-purple) !important;
      border: 1px solid var(--color-ai-border);
    }
    .mobile-user-profile {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 700;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }
    .width-full { width: 100%; }
    .margin-top-xs { margin-top: 0.5rem; }

    .app-main-layout {
      min-height: calc(100vh - 64px - 320px);
    }

    /* ADAPTIVE FOOTER STYLES (Pure White in Day Mode, Dark in Dark Mode) */
    .qp-footer {
      background: var(--footer-bg);
      border-top: 1px solid var(--footer-border);
      padding: 3.5rem 0 1.5rem 0;
      margin-top: auto;
      color: var(--footer-text);
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    .footer-container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 2.5rem;
      padding-bottom: 2.5rem;
      border-bottom: 1px solid var(--footer-bottom-border);
    }
    .mb-2 { margin-bottom: 0.65rem; }
    .brand-title-footer {
      color: var(--footer-heading) !important;
      font-size: 1.15rem;
      font-weight: 800;
    }
    .brand-desc {
      font-size: 0.875rem;
      color: var(--footer-text) !important;
      line-height: 1.6;
      max-width: 340px;
      margin-bottom: 1.0rem;
    }
    .badge-ai-footer {
      background: var(--color-ai-bg);
      border: 1px solid var(--color-ai-border);
      color: var(--color-ai-purple) !important;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
    }
    .footer-heading {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--footer-heading) !important;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 1.0rem;
    }
    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      li {
        font-size: 0.875rem;
        color: var(--footer-text);
        a {
          color: var(--footer-text) !important;
          text-decoration: none !important;
          transition: color 0.15s ease;
          &:hover { color: var(--color-primary-600) !important; text-decoration: none !important; }
        }
        span { color: var(--footer-muted) !important; }
      }
    }

    .footer-bottom-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.5rem;
      font-size: 0.8rem;
      color: var(--footer-muted) !important;
      p { margin: 0; }
    }
    .footer-bottom-links {
      display: flex;
      gap: 0.6rem;
      align-items: center;
      a { color: var(--footer-muted) !important; text-decoration: none; &:hover { color: var(--color-primary-600) !important; } }
    }

    @media (max-width: 900px) {
      .nav-menu { display: none; }
      .desktop-only { display: none !important; }
      .mobile-toggle-btn { display: block; }
      .footer-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 600px) {
      .footer-grid { grid-template-columns: 1fr; }
      .footer-bottom-bar { flex-direction: column; gap: 0.75rem; text-align: center; }
    }
  `]
})
export class AppComponent {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly UserRole = UserRole;
  private readonly router = inject(Router);

  readonly mobileMenuOpen = signal(false);

  hideLayout(): boolean {
    const url = this.router.url;
    return url === '/' || url.startsWith('/auth') || url.startsWith('/q/') || (url.includes('/quiz/') && !url.includes('/edit'));
  }

  getRoleName(role?: number): string {
    switch (role) {
      case UserRole.SuperAdmin: return 'Admin';
      case UserRole.TenantAdmin: return 'Admin';
      case UserRole.Instructor: return 'Creator';
      case UserRole.Student: return 'Learner';
      default: return 'User';
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

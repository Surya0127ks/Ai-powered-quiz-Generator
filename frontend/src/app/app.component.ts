import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, NavigationSkipped, Event } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { UserRole } from './core/models/auth.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (isNavigating()) {
      <div class="global-page-loader" role="status" aria-live="polite" aria-label="Loading page">
        <div class="spinner-brand" aria-hidden="true">
          <div class="spinner-circle"></div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </div>
      </div>
    }

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
            <span class="brand-title">Quizzy AI</span>
          </a>

          <!-- Desktop Nav Links -->
          <nav class="nav-menu" aria-label="Primary navigation">
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
              @if (canManageQuizzes()) {
              <a routerLink="/quizzes/new" routerLinkActive="active" class="nav-link">
                <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
                <span>Create Quiz</span>
              </a>
              }

              <a routerLink="/student/progress" routerLinkActive="active" class="nav-link">
                <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20v-6M6 20V10M18 20V4"></path>
                </svg>
                <span>My Progress</span>
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

          <!-- Right: Account & Theme Toggle -->
          <div class="nav-right">
            <!-- Light / Dark Theme Switcher Button -->
            <button
              (click)="themeService.toggleTheme()"
              class="theme-toggle-btn"
              [attr.aria-label]="themeService.isDarkMode() ? 'Switch to light theme' : 'Switch to dark theme'"
              [attr.aria-pressed]="themeService.isDarkMode()"
              [title]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            >
              @if (themeService.isDarkMode()) {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              }
            </button>

            @if (authService.isAuthenticated()) {
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
            <button
              (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              class="mobile-toggle-btn"
              [attr.aria-expanded]="mobileMenuOpen()"
              aria-controls="mobile-primary-navigation"
              [attr.aria-label]="mobileMenuOpen() ? 'Close navigation menu' : 'Open navigation menu'"
            >
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
          <nav id="mobile-primary-navigation" class="mobile-drawer-menu" aria-label="Mobile navigation">
            <a routerLink="/dashboard" (click)="mobileMenuOpen.set(false)" class="mobile-nav-item">
              <svg class="drawer-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span>Dashboard</span>
            </a>
            @if (authService.isAuthenticated()) {
              @if (canManageQuizzes()) {
              <a routerLink="/quizzes/new" (click)="mobileMenuOpen.set(false)" class="mobile-nav-item">
                <svg class="drawer-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
                <span>Create Quiz</span>
              </a>
              }
              <a routerLink="/student/progress" (click)="mobileMenuOpen.set(false)" class="mobile-nav-item">
                <svg class="drawer-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg>
                <span>My Progress</span>
              </a>
              <a routerLink="/certificate/generator" (click)="mobileMenuOpen.set(false)" class="mobile-nav-item">
                <svg class="drawer-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"></circle><path d="M8.5 13.5 7 22l5-2.5L17 22l-1.5-8.5"></path></svg>
                <span>Certificates</span>
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
              <button (click)="onLogout(); mobileMenuOpen.set(false)" class="btn btn-outline btn-sm width-full margin-top-xs">
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
          </nav>
        }
      </header>
    }

    <!-- Main View Outlet -->
    <main class="app-main-layout">
      <router-outlet></router-outlet>
    </main>

    <!-- Compact Study Workspace Footer -->
    @if (!hideLayout()) {
      <footer class="qp-footer no-print">
        <div class="footer-container">
          <div class="footer-compact-row">
            <div class="footer-compact-brand">
              <span class="brand-title-footer">Quizzy AI</span>
              <span class="footer-dot">·</span>
              <span class="footer-tagline-inline">Study &amp; Assessment Workspace</span>
            </div>
            <div class="footer-bottom-links">
              <a routerLink="/dashboard">Dashboard</a>
              <a routerLink="/student/progress">My Progress</a>
              <a routerLink="/verify-certificate">Verify Certificate</a>
              <span class="footer-copy">© 2026 Quizzy AI</span>
            </div>
          </div>
        </div>
      </footer>
    }
  `,
  styles: [`
    /* Global Page Loader */
    .global-page-loader {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: color-mix(in srgb, var(--bg-app) 88%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .spinner-brand {
      position: relative;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary-600);
    }
    .spinner-circle {
      position: absolute;
      inset: 0;
      border: 3.5px solid var(--color-primary-100);
      border-top-color: var(--color-primary-600);
      border-right-color: var(--color-ai-purple);
      border-radius: 50%;
      will-change: transform;
      animation: qp-spin 0.85s linear infinite !important;
    }
    @keyframes qp-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .qp-navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 60px;
      background: var(--nav-bg);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--nav-border);
      display: flex;
      flex-direction: column;
      justify-content: center;
      transition: background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .nav-container {
      width: 100%;
      max-width: 1280px;
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
      gap: 0.625rem;
      text-decoration: none;
      flex-shrink: 0;
    }
    .logo-box {
      width: 30px;
      height: 30px;
      border-radius: 6px;
      background: var(--text-heading);
      color: var(--bg-surface);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-heading) !important;
      letter-spacing: -0.015em;
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
      gap: 0.5rem;
      height: 34px;
      padding: 0 0.75rem;
      border-radius: 8px;
      border: 1px solid transparent;
      text-decoration: none;
      color: var(--text-body) !important;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
      span { color: inherit !important; }
      .nav-svg { width: 16px; height: 16px; stroke: var(--text-muted); stroke-width: 1.5; transition: stroke 150ms cubic-bezier(0.22, 1, 0.36, 1); }

      &:hover {
        background-color: var(--bg-hover);
        color: var(--text-heading) !important;
        .nav-svg { stroke: var(--text-heading); }
      }

      &.active {
        background-color: var(--bg-surface);
        border-color: var(--border-hairline);
        color: var(--text-heading) !important;
        font-weight: 500;
        .nav-svg { stroke: var(--color-primary-600); }
      }
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    /* Theme Toggle Switcher Button */
    .theme-toggle-btn {
      width: 36px;
      height: 36px;
      flex: 0 0 36px;
      border-radius: 8px;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      cursor: pointer;
      color: var(--text-body);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms cubic-bezier(0.22, 1, 0.36, 1);
      &:hover {
        background: var(--bg-hover);
        border-color: var(--border-strong);
        color: var(--text-heading);
      }
    }

    /* User Profile Chip */
    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.65rem 0.25rem 0.25rem;
      border-radius: 8px;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
    }
    .avatar-circle {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      background: var(--color-primary-600);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
      .user-name { font-size: 0.8125rem; font-weight: 500; color: var(--text-heading) !important; }
      .user-role { font-size: 0.7rem; color: var(--text-muted) !important; font-weight: 400; }
    }

    /* Mobile Hamburger & Drawer Menu */
    .mobile-toggle-btn {
      display: none;
      width: 44px;
      height: 44px;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-primary);
      padding: 0.35rem;
    }

    .mobile-drawer-menu {
      position: absolute;
      top: 60px;
      left: 0;
      right: 0;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-hairline);
      box-shadow: var(--shadow-lg);
      padding: 0.5rem 0 1rem;
      max-height: min(72dvh, 560px);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
      z-index: 1000;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      animation: mobile-drawer-enter 160ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes mobile-drawer-enter {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .mobile-nav-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      min-height: 40px;
      padding: 0.5rem 1.5rem;
      text-decoration: none;
      color: var(--text-body) !important;
      font-weight: 500;
      font-size: 0.9375rem;
      background: transparent;
      border-left: 2px solid transparent;
      transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
      .drawer-svg { stroke: var(--text-muted); flex-shrink: 0; }
      &:hover {
        background: var(--bg-hover);
        border-left-color: var(--color-primary-600);
        color: var(--text-heading) !important;
        .drawer-svg { stroke: var(--text-heading); }
      }
    }
    .mobile-user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
      font-size: 0.875rem;
      padding: 1rem 1.5rem 0.5rem 1.5rem;
      margin-top: 0.5rem;
      border-top: 1px solid var(--border-hairline);
    }
    .width-full { width: calc(100% - 3rem); margin-left: 1.5rem; margin-right: 1.5rem; }
    .margin-top-xs { margin-top: 0.5rem; }

    .app-main-layout {
      min-height: calc(100dvh - 60px - 72px);
    }

    /* COMPACT WORKSPACE FOOTER */
    .qp-footer {
      background: var(--bg-app);
      border-top: 1px solid var(--border-hairline);
      padding: 1.25rem 0;
      margin-top: auto;
      color: var(--text-body);
    }
    .footer-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    .footer-compact-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem 1.5rem;
    }
    .footer-compact-brand {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .brand-title-footer {
      color: var(--text-heading) !important;
      font-size: 0.9375rem;
      font-weight: 600;
      letter-spacing: -0.015em;
    }
    .footer-dot { color: var(--text-muted); }
    .footer-tagline-inline { font-size: 0.875rem; color: var(--text-muted); }
    .footer-copy { font-size: 0.8125rem; color: var(--text-muted); font-family: var(--font-mono); }
    .footer-bottom-links {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      align-items: center;
      font-size: 0.875rem;
      a {
        color: var(--text-body) !important;
        text-decoration: none;
        font-weight: 500;
        transition: color var(--transition-fast);
        &:hover { color: var(--text-heading) !important; }
      }
    }

    @media (max-width: 900px) {
      .nav-menu { display: none; }
      .desktop-only { display: none !important; }
      .mobile-toggle-btn { display: flex; }
    }
    @media (max-width: 600px) {
      .footer-compact-row { flex-direction: column; align-items: flex-start; gap: 0.65rem; }
      .footer-bottom-links { gap: 0.75rem 1rem; }
      .footer-container { padding: 0 1rem; }
      .nav-container { padding-inline: 1rem; gap: 0.5rem; }
      .brand-title { font-size: 1rem; }
      .nav-right { gap: 0.5rem; }
    }
  `]
})
export class AppComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly UserRole = UserRole;
  private readonly router = inject(Router);

  readonly mobileMenuOpen = signal(false);
  readonly isNavigating = signal(false);
  private navHideTimer: ReturnType<typeof setTimeout> | null = null;
  private navSafetyTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        if (this.navHideTimer) {
          clearTimeout(this.navHideTimer);
          this.navHideTimer = null;
        }
        if (this.navSafetyTimer) {
          clearTimeout(this.navSafetyTimer);
        }
        this.isNavigating.set(true);
        this.mobileMenuOpen.set(false);
        // Never trap the UI under a stuck route loader if a lazy transition stalls
        this.navSafetyTimer = setTimeout(() => {
          this.isNavigating.set(false);
        }, 2500);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError ||
        event instanceof NavigationSkipped
      ) {
        if (event instanceof NavigationError) {
          const msg = String(event.error?.message || event.error || '');
          if (/ChunkLoadError|dynamically imported module|Loading chunk/i.test(msg)) {
            const reloadedKey = 'qp_chunk_reload';
            if (!sessionStorage.getItem(reloadedKey)) {
              sessionStorage.setItem(reloadedKey, '1');
              window.location.reload();
              return;
            }
          }
        }
        if (this.navSafetyTimer) {
          clearTimeout(this.navSafetyTimer);
          this.navSafetyTimer = null;
        }
        this.navHideTimer = setTimeout(() => {
          this.isNavigating.set(false);
        }, 120);
      }
    });
  }

  @HostListener('document:keydown.escape')
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  hideLayout(): boolean {
    const url = this.router.url;
    return url === '/' || url.startsWith('/auth') || url.startsWith('/q/') || (url.includes('/quiz/') && !url.includes('/edit'));
  }

  getRoleName(role?: number): string {
    switch (role) {
      case UserRole.SuperAdmin: return 'Admin';
      case UserRole.TenantAdmin: return 'Admin';
      case UserRole.Instructor: return 'Teacher / Tutor';
      case UserRole.Student: return 'Student';
      default: return 'User';
    }
  }

  canManageQuizzes(): boolean {
    const role = this.authService.userRole();
    return role === UserRole.Student || role === UserRole.Instructor || role === UserRole.TenantAdmin || role === UserRole.SuperAdmin;
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

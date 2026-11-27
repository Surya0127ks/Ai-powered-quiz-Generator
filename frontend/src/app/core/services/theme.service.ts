import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('qp-theme');
    } catch {
      // Keep the app usable when browser storage is disabled.
    }
    if (saved) {
      const isDark = saved === 'dark';
      this.isDarkMode.set(isDark);
      this.applyTheme(isDark);
    } else {
      // Default to light theme as requested
      this.isDarkMode.set(false);
      this.applyTheme(false);
    }
  }

  toggleTheme(): void {
    const nextDark = !this.isDarkMode();
    this.isDarkMode.set(nextDark);
    try {
      localStorage.setItem('qp-theme', nextDark ? 'dark' : 'light');
    } catch {
      // The selected theme still applies for this page session.
    }
    this.applyTheme(nextDark);
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}

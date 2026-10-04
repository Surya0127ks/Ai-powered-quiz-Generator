import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of, shareReplay } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/auth';

  // In-flight refresh token observable to prevent concurrent duplicate refresh requests
  private refreshInProgress$: Observable<AuthResponse> | null = null;

  // State Signals
  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly token = signal<string | null>(localStorage.getItem('access_token'));
  readonly refreshToken = signal<string | null>(localStorage.getItem('refresh_token'));

  // Computed Selectors
  readonly isAuthenticated = computed(() => !!this.currentUser() && !!this.token());
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly tenantId = computed(() => this.currentUser()?.tenantId ?? null);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  refreshSession(): Observable<AuthResponse> {
    const currentRefreshToken = this.refreshToken();
    const currentAccessToken = this.token();

    if (!currentRefreshToken || !currentAccessToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    this.refreshInProgress$ = this.http.post<AuthResponse>(`${this.baseUrl}/refresh-token`, {
      accessToken: currentAccessToken,
      refreshToken: currentRefreshToken
    }).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
        this.refreshInProgress$ = null;
      }),
      catchError(err => {
        this.refreshInProgress$ = null;
        this.logout();
        return throwError(() => err);
      }),
      shareReplay(1)
    );

    return this.refreshInProgress$;
  }

  isTokenExpired(tokenStr?: string | null): boolean {
    const token = tokenStr ?? this.token();
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      return Date.now() >= (payload.exp * 1000 - 10000); // 10s buffer
    } catch {
      return false;
    }
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`).pipe(
      tap(user => {
        this.normalizeUserRole(user);
        this.currentUser.set(user);
        localStorage.setItem('user_profile', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.token.set(null);
    this.refreshToken.set(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
  }

  private handleAuthSuccess(response: AuthResponse): void {
    this.normalizeUserRole(response.user);
    this.token.set(response.accessToken);
    this.refreshToken.set(response.refreshToken);
    this.currentUser.set(response.user);

    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    localStorage.setItem('user_profile', JSON.stringify(response.user));
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem('user_profile');
    if (!stored) return null;
    try {
      const user = JSON.parse(stored) as User;
      this.normalizeUserRole(user);
      return user;
    } catch {
      return null;
    }
  }

  private normalizeUserRole(user: User): void {
    if (typeof user.role === 'string') {
      const roleStr = user.role as string;
      if (roleStr.toLowerCase() === 'student') user.role = 3;
      else if (roleStr.toLowerCase() === 'instructor') user.role = 2;
      else if (roleStr.toLowerCase() === 'tenantadmin') user.role = 1;
      else if (roleStr.toLowerCase() === 'systemadmin') user.role = 0;
    }
  }
}

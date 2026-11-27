import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="access-denied-page">
      <section class="access-denied-card saas-card" aria-labelledby="access-denied-title">
        <span class="status-code">403 · Access restricted</span>
        <h1 id="access-denied-title">Creator tools are for teachers and tutors</h1>
        <p>
          Your Student account can take quizzes shared by teachers and review your own results.
          Quiz creation, publishing, and learner reports require a Teacher / Tutor account.
        </p>
        <div class="access-actions">
          <a routerLink="/dashboard" class="btn btn-primary">Back to my dashboard</a>
          <button type="button" class="btn btn-outline" (click)="switchAccount()">Switch account</button>
        </div>
      </section>
    </main>
  `,
  styles: [`
    .access-denied-page {
      min-height: calc(100vh - 120px);
      display: grid;
      place-items: center;
      padding: 2rem 1rem;
      background: var(--bg-app);
    }
    .access-denied-card {
      width: min(100%, 560px);
      padding: clamp(1.5rem, 5vw, 2.5rem);
      text-align: center;
    }
    .status-code {
      display: inline-flex;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-full);
      color: var(--color-primary-700);
      background: var(--color-primary-50);
      font-size: 0.75rem;
      font-weight: 700;
    }
    h1 { margin: 1rem 0 0.65rem; color: var(--text-heading); font-size: clamp(1.4rem, 5vw, 1.9rem); line-height: 1.2; }
    p { margin: 0; color: var(--text-body); line-height: 1.6; }
    .access-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; margin-top: 1.5rem; }
    @media (max-width: 480px) { .access-actions { flex-direction: column; } .access-actions > * { width: 100%; } }
  `]
})
export class UnauthorizedComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  switchAccount(): void {
    this.authService.logout();
    void this.router.navigate(['/auth/login']);
  }
}

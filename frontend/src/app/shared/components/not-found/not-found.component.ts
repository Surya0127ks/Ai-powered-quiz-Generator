import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-found-container">
      <div class="card max-w-md mx-auto">
        <div class="empty-icon-wrapper">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1>404</h1>
        <h2>Quiz or Page Not Found</h2>
        <p>The quiz assessment or page URL you are trying to access does not exist or may have been deleted.</p>
        <a routerLink="/dashboard" class="btn btn-primary margin-top">Return to Dashboard →</a>
      </div>
    </div>
  `,
  styles: [
    `
      .not-found-container {
        min-height: calc(100vh - 120px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2.5rem 1.5rem;
        text-align: center;
      }
      .max-w-md { max-width: 460px; width: 100%; margin: 0 auto; }
      .margin-top { margin-top: 1.5rem; }
      .empty-icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--color-primary-50);
        color: var(--color-primary-600);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.25rem auto;
        svg { stroke: var(--color-primary-600); }
      }
      h1 { font-size: 3.5rem; color: var(--color-primary-600) !important; font-weight: 800; margin-bottom: 0.25rem; }
      h2 { font-size: 1.35rem; color: var(--text-heading) !important; font-weight: 700; margin-bottom: 0.5rem; }
      p { font-size: 0.9rem; color: var(--text-body) !important; line-height: 1.5; margin-bottom: 1.25rem; }
    `,
  ],
})
export class NotFoundComponent {}

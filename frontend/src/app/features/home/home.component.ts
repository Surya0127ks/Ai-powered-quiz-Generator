import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home-container">
      <h1>Welcome to LMS SaaS</h1>
      <p>A production-ready Learning Management System.</p>
      <a routerLink="/auth" class="btn-primary">Get Started</a>
    </div>
  `,
  styles: [
    `
      .home-container {
        text-align: center;
        padding: 3rem 1rem;
        h1 {
          font-size: 2.5rem;
          color: #1976d2;
        }
        p {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 2rem;
        }
        .btn-primary {
          display: inline-block;
          padding: 0.75rem 2rem;
          background-color: #1976d2;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          &:hover {
            background-color: #1565c0;
          }
        }
      }
    `,
  ],
})
export class HomeComponent {}

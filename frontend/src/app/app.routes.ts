import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
    title: 'QuizPulse - AI Powered Quiz Generator',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'QuizPulse - Sign In',
    canActivate: [guestGuard],
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'QuizPulse - Create Account',
    canActivate: [guestGuard],
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    title: 'QuizPulse - Reset Password',
    canActivate: [guestGuard],
  },
  {
    path: 'auth',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'QuizPulse - Dashboard',
    canActivate: [authGuard],
  },
  {
    path: 'student/progress',
    loadComponent: () =>
      import('./features/courses/student-progress/student-progress.component').then((m) => m.StudentProgressComponent),
    title: 'QuizPulse - Attempt History',
    canActivate: [authGuard],
  },
  {
    path: 'verify-certificate',
    loadComponent: () =>
      import('./features/courses/certificate-verify/certificate-verify.component').then((m) => m.CertificateVerifyComponent),
    title: 'QuizPulse - Verify Certificate',
  },
  {
    path: 'certificate/generator',
    loadComponent: () =>
      import('./features/courses/certificate-generator/certificate-generator.component').then((m) => m.CertificateGeneratorComponent),
    title: 'QuizPulse - Certificate Studio',
    canActivate: [authGuard],
  },
  {
    path: 'quiz/:id/edit',
    loadComponent: () => import('./features/quizzes/quiz-editor/quiz-editor.component').then(c => c.QuizEditorComponent),
    title: 'QuizPulse - Edit Quiz',
    canActivate: [authGuard]
  },
  {
    path: 'quiz/:id/success',
    loadComponent: () => import('./features/quizzes/quiz-publish-success/quiz-publish-success.component').then(c => c.QuizPublishSuccessComponent),
    title: 'QuizPulse - Quiz Published',
    canActivate: [authGuard]
  },
  {
    path: 'quiz/:id',
    loadComponent: () =>
      import('./features/courses/quiz-player/quiz-player.component').then((m) => m.QuizPlayerComponent),
    title: 'QuizPulse - Take Assessment',
  },
  {
    path: 'q/:shortId',
    loadComponent: () =>
      import('./features/courses/quiz-player/quiz-player.component').then((m) => m.QuizPlayerComponent),
    title: 'QuizPulse - Public Quiz',
  },
  {
    path: 'quizzes/new',
    loadComponent: () =>
      import('./features/quizzes/quiz-creator/quiz-creator.component').then((m) => m.QuizCreatorComponent),
    title: 'QuizPulse - Create Quiz with AI',
    canActivate: [authGuard],
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'QuizPulse - Access Denied',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'QuizPulse - Page Not Found',
  },
];


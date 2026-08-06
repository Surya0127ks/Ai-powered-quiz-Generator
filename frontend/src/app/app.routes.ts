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
    title: 'QuizHub - Sign In',
    canActivate: [guestGuard],
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'QuizHub - Create Account',
    canActivate: [guestGuard],
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    title: 'QuizHub - Reset Password',
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
    title: 'QuizHub - Dashboard',
    canActivate: [authGuard],
  },
  {
    path: 'student/progress',
    loadComponent: () =>
      import('./features/courses/student-progress/student-progress.component').then((m) => m.StudentProgressComponent),
    title: 'QuizHub - Attempt History',
    canActivate: [authGuard],
  },
  {
    path: 'verify-certificate',
    loadComponent: () =>
      import('./features/courses/certificate-verify/certificate-verify.component').then((m) => m.CertificateVerifyComponent),
    title: 'QuizHub - Verify Certificate',
  },
  {
    path: 'certificate/generator',
    loadComponent: () =>
      import('./features/courses/certificate-generator/certificate-generator.component').then((m) => m.CertificateGeneratorComponent),
    title: 'QuizHub - Certificate Studio',
    canActivate: [authGuard],
  },
  {
    path: 'quiz/:id/edit',
    loadComponent: () => import('./features/quizzes/quiz-editor/quiz-editor.component').then(c => c.QuizEditorComponent),
    canActivate: [authGuard]
  },
  {
    path: 'quiz/:id',
    loadComponent: () =>
      import('./features/courses/quiz-player/quiz-player.component').then((m) => m.QuizPlayerComponent),
    title: 'QuizHub - Take Assessment Quiz',
  },
  {
    path: 'q/:shortId',
    loadComponent: () =>
      import('./features/courses/quiz-player/quiz-player.component').then((m) => m.QuizPlayerComponent),
    title: 'QuizHub - Public Quiz',
  },
  {
    path: 'quizzes/new',
    loadComponent: () =>
      import('./features/quizzes/quiz-creator/quiz-creator.component').then((m) => m.QuizCreatorComponent),
    title: 'QuizHub - Create Assessment Quiz',
    canActivate: [authGuard],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'QuizHub - Page Not Found',
  },
];

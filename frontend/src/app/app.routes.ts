import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
    title: 'Quizzy AI - AI Powered Quiz Generator',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Quizzy AI - Sign In',
    canActivate: [guestGuard],
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'Quizzy AI - Create Account',
    canActivate: [guestGuard],
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    title: 'Quizzy AI - Reset Password',
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
    title: 'Quizzy AI - Dashboard',
    canActivate: [authGuard],
  },
  {
    path: 'student/progress',
    loadComponent: () =>
      import('./features/courses/student-progress/student-progress.component').then((m) => m.StudentProgressComponent),
    title: 'Quizzy AI - Attempt History',
    canActivate: [authGuard],
  },
  {
    path: 'verify-certificate',
    loadComponent: () =>
      import('./features/courses/certificate-verify/certificate-verify.component').then((m) => m.CertificateVerifyComponent),
    title: 'Quizzy AI - Verify Certificate',
  },
  {
    path: 'certificate/generator',
    loadComponent: () =>
      import('./features/courses/certificate-generator/certificate-generator.component').then((m) => m.CertificateGeneratorComponent),
    title: 'Quizzy AI - Certificate Studio',
    canActivate: [authGuard],
  },
  {
    path: 'quiz/:id/edit',
    loadComponent: () => import('./features/quizzes/quiz-editor/quiz-editor.component').then(c => c.QuizEditorComponent),
    title: 'Quizzy AI - Edit Quiz',
    canActivate: [authGuard]
  },
  {
    path: 'quiz/:id/success',
    loadComponent: () => import('./features/quizzes/quiz-publish-success/quiz-publish-success.component').then(c => c.QuizPublishSuccessComponent),
    title: 'Quizzy AI - Quiz Published',
    canActivate: [authGuard]
  },
  {
    path: 'quiz/:id',
    loadComponent: () =>
      import('./features/courses/quiz-player/quiz-player.component').then((m) => m.QuizPlayerComponent),
    title: 'Quizzy AI - Take Assessment',
  },
  {
    path: 'q/:shortId',
    loadComponent: () =>
      import('./features/courses/quiz-player/quiz-player.component').then((m) => m.QuizPlayerComponent),
    title: 'Quizzy AI - Public Quiz',
  },
  {
    path: 'quizzes/new',
    loadComponent: () =>
      import('./features/quizzes/quiz-creator/quiz-creator.component').then((m) => m.QuizCreatorComponent),
    title: 'Quizzy AI - Create Quiz with AI',
    canActivate: [authGuard],
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Quizzy AI - Access Denied',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Quizzy AI - Page Not Found',
  },
];


import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Quiz, QuizAttemptResult, SubmitQuizAttemptRequest, CreateQuizRequest, UserQuizDashboardSummary, QuizLeaderboardItem } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  readonly currentQuiz = signal<Quiz | null>(null);
  readonly lastResult = signal<QuizAttemptResult | null>(null);

  getDashboardSummary(): Observable<UserQuizDashboardSummary> {
    return this.http.get<UserQuizDashboardSummary>(`${this.baseUrl}/quizzes/dashboard-summary`);
  }

  getQuizById(quizId: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.baseUrl}/quizzes/${quizId}`).pipe(
      tap(quiz => this.currentQuiz.set(quiz))
    );
  }

  getQuizByLesson(lessonId: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.baseUrl}/lessons/${lessonId}/quiz`).pipe(
      tap(quiz => this.currentQuiz.set(quiz))
    );
  }

  getQuizLeaderboard(quizId: string): Observable<QuizLeaderboardItem[]> {
    return this.http.get<QuizLeaderboardItem[]>(`${this.baseUrl}/quizzes/${quizId}/leaderboard`);
  }

  createQuiz(request: CreateQuizRequest): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.baseUrl}/quizzes`, request);
  }

  updateQuiz(quizId: string, request: any): Observable<Quiz> {
    return this.http.put<Quiz>(`${this.baseUrl}/quizzes/${quizId}`, request);
  }

  submitQuizAttempt(quizId: string, request: SubmitQuizAttemptRequest): Observable<QuizAttemptResult> {
    return this.http.post<QuizAttemptResult>(`${this.baseUrl}/quizzes/${quizId}/submit`, request).pipe(
      tap(result => this.lastResult.set(result))
    );
  }

  getPublicQuizById(publicId: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.baseUrl}/public/quizzes/${publicId}`).pipe(
      tap(quiz => this.currentQuiz.set(quiz))
    );
  }

  getAttemptDetails(attemptId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/quizzes/attempts/${attemptId}`);
  }

  submitPublicQuizAttempt(quizId: string, request: SubmitQuizAttemptRequest): Observable<QuizAttemptResult> {
    return this.http.post<QuizAttemptResult>(`${this.baseUrl}/public/quizzes/${quizId}/submit`, request).pipe(
      tap(result => this.lastResult.set(result))
    );
  }

  clearAttemptHistory(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/quizzes/attempts/clear`);
  }

  deleteAttempt(attemptId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/quizzes/attempts/${attemptId}`);
  }

  deleteQuiz(quizId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/quizzes/${quizId}`);
  }

  extendQuizLimit(quizId: string): Observable<{ newMaxStudents: number; limitExtensionCount: number; message: string }> {
    return this.http.post<any>(`${this.baseUrl}/quizzes/${quizId}/extend-limit`, {});
  }
}

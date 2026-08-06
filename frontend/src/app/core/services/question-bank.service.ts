import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateQuizQuestionItem } from '../models/quiz.model';

export interface SubTopicItem {
  id: string;
  name: string;
}

export interface DomainTopicItem {
  id: string;
  name: string;
  description?: string;
  subTopics: SubTopicItem[];
}

export interface GenerateQuestionsRequest {
  domainTopicId?: string;
  subTopicId?: string;
  customTopic?: string;
  questionCount: number;
  difficulty?: string;
  apiKey?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionBankService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/question-bank';

  getDomains(): Observable<DomainTopicItem[]> {
    return this.http.get<DomainTopicItem[]>(`${this.baseUrl}/domains`);
  }

  generateQuestions(request: GenerateQuestionsRequest): Observable<CreateQuizQuestionItem[]> {
    return this.http.post<CreateQuizQuestionItem[]>(`${this.baseUrl}/generate`, request);
  }
}

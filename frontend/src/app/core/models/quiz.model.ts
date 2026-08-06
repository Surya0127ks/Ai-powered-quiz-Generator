import { QuestionType } from './course.model';
export { QuestionType };

export interface QuizOption {
  id: string;
  optionText: string;
  orderIndex: number;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  type: QuestionType;
  points: number;
  orderIndex: number;
  explanation?: string;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  lessonId?: string;
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  isPublished?: boolean;
  passingScorePercentage: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  publicId?: string;
  negativeMarkingPoints?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  expiryDateUtc?: string;
  enableCertificate?: boolean;
  certificateForTopperOnly?: boolean;
  autoSubmit?: boolean;
  showResultsAfterSubmission?: boolean;
  totalMarks?: number;
  welcomeMessage?: string;
  instructions?: string;
  showCorrectAnswers?: boolean;
  shortId?: string;
  createdByUserId?: string;
  questions: QuizQuestion[];
  maxStudents?: number;
  limitExtensionCount?: number;
  isCapReached?: boolean;
}

export interface CreateQuizOptionItem {
  optionText: string;
  isCorrect: boolean;
}

export interface CreateQuizQuestionItem {
  questionText: string;
  type: QuestionType;
  points: number;
  explanation?: string;
  options: CreateQuizOptionItem[];
}

export interface CreateQuizRequest {
  lessonId?: string;
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  isPublished?: boolean;
  passingScorePercentage: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  negativeMarkingPoints?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  expiryDateUtc?: string;
  enableCertificate?: boolean;
  certificateForTopperOnly?: boolean;
  autoSubmit?: boolean;
  showResultsAfterSubmission?: boolean;
  totalMarks?: number;
  questions: CreateQuizQuestionItem[];
  maxStudents?: number;
}

export interface StudentAnswerItem {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
}

export interface SubmitQuizAttemptRequest {
  answers: StudentAnswerItem[];
  studentName?: string;
  rollNumber?: string;
  className?: string;
  department?: string;
  email?: string;
  phoneNumber?: string;
  focusLostCount?: number;
  isDisqualified?: boolean;
  disqualificationReason?: string;
}

export interface AnswerReviewItem {
  questionId: string;
  questionText: string;
  pointsEarned: number;
  maxPoints: number;
  isCorrect: boolean;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  explanation?: string;
}

export interface QuizAttemptResult {
  attemptId: string;
  quizId: string;
  scorePercentage: number;
  totalPointsEarned: number;
  totalPossiblePoints: number;
  isPassed: boolean;
  submittedAtUtc: string;
  reviews: AnswerReviewItem[];
  certificateNumber?: string;
  isCapReached?: boolean;
  maxStudents?: number;
  limitExtensionCount?: number;
}

export interface UserQuizItem {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  questionCount: number;
  timeLimitMinutes?: number;
  isPublished: boolean;
  totalAttemptsCount: number;
  avgScorePercentage: number;
  createdAtUtc: string;
  shortId?: string;
  maxStudents?: number;
  limitExtensionCount?: number;
  isCapReached?: boolean;
}

export interface UserAttemptItem {
  id: string;
  quizId: string;
  quizTitle: string;
  scorePercentage: number;
  isPassed: boolean;
  submittedAtUtc: string;
}

export interface QuizLeaderboardItem {
  attemptId: string;
  studentUserId: string;
  studentName: string;
  studentEmail: string;
  scorePercentage: number;
  totalPointsEarned: number;
  totalPossiblePoints: number;
  isPassed: boolean;
  submittedAtUtc: string;
  rank: number;
  focusLostCount?: number;
  isDisqualified?: boolean;
}

export interface UserQuizDashboardSummary {
  quizzesCreatedCount: number;
  publishedCount: number;
  draftsCount: number;
  totalAttemptsCount: number;
  avgScorePercentage: number;
  certificatesEarnedCount: number;
  myQuizzes: UserQuizItem[];
  myAttempts: UserAttemptItem[];
}

export interface AdminAttemptOption {
  optionId: string;
  optionText: string;
  isCorrect: boolean;
}

export interface AdminAttemptQuestion {
  questionId: string;
  questionText: string;
  points: number;
  pointsEarned: number;
  isCorrect: boolean;
  options: AdminAttemptOption[];
  selectedOptionIds: string[];
  explanation?: string;
}

export interface AdminAttemptDetails {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  studentName: string;
  studentEmail: string;
  rollNumber?: string;
  className?: string;
  department?: string;
  scorePercentage: number;
  totalPointsEarned: number;
  totalPossiblePoints: number;
  isPassed: boolean;
  submittedAtUtc?: string;
  focusLostCount: number;
  questions: AdminAttemptQuestion[];
}

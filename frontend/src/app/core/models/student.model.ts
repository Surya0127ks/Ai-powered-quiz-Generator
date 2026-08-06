export interface StudentEnrollmentProgressItem {
  courseId: string;
  courseTitle: string;
  thumbnailUrl?: string;
  progressPercentage: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lastLessonId?: string;
  lastLessonTitle?: string;
}

export interface StudentQuizAttemptSummary {
  quizId: string;
  quizTitle: string;
  scorePercentage: number;
  isPassed: boolean;
  attemptedAt: string;
}

export interface StudentAssignmentSubmissionSummary {
  assignmentId: string;
  assignmentTitle: string;
  status: string;
  grade?: number;
  submittedAt: string;
}

export interface StudentCertificateSummary {
  certificateId: string;
  courseId: string;
  courseTitle: string;
  certificateCode: string;
  issuedAt: string;
}

export interface StudentDashboardSummary {
  totalEnrolledCourses: number;
  completedCoursesCount: number;
  totalCertificatesEarned: number;
  totalLessonsCompleted: number;
  totalWatchTimeMinutes: number;
  activeEnrollmentItems: StudentEnrollmentProgressItem[];
  quizAttemptSummaries: StudentQuizAttemptSummary[];
  assignmentSubmissionSummaries: StudentAssignmentSubmissionSummary[];
  certificateSummaries: StudentCertificateSummary[];
}

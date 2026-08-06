import { LessonType } from './course.model';

export interface RecentCompletionItem {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  lessonType: LessonType;
  completedAtUtc: string;
}

export interface CourseProgressOverview {
  courseId: string;
  courseTitle: string;
  courseThumbnailUrl?: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastActivityAtUtc: string;
}

export interface StudentProgressSummary {
  totalEnrolledCourses: number;
  totalCompletedCourses: number;
  totalLessonsCompleted: number;
  totalWatchTimeMinutes: number;
  overallCompletionPercentage: number;
  recentCompletions: RecentCompletionItem[];
  courseOverviews: CourseProgressOverview[];
}

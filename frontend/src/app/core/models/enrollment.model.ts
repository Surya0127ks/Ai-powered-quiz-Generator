export enum EnrollmentStatus {
  Active = 1,
  Completed = 2,
  Cancelled = 3,
  Expired = 4
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnailUrl?: string;
  enrolledAtUtc: string;
  status: EnrollmentStatus;
  completedAtUtc?: string;
  progressPercentage: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
}

export interface CourseAccess {
  courseId: string;
  isEnrolled: boolean;
  isFreeCourse: boolean;
  status?: EnrollmentStatus;
  canAccess: boolean;
}

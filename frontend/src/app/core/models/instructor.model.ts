import { CourseLevel, CourseStatus } from './course.model';

export interface InstructorCoursePerformance {
  courseId: string;
  title: string;
  categoryName: string;
  level: CourseLevel;
  status: CourseStatus;
  price: number;
  totalEnrolledStudents: number;
  completedStudentsCount: number;
  completionRate: number;
  createdAtUtc: string;
}

export interface InstructorDashboardSummary {
  totalCourses: number;
  publishedCoursesCount: number;
  draftCoursesCount: number;
  totalEnrolledStudents: number;
  totalCompletedEnrollments: number;
  totalEarnings: number;
  averageCompletionRate: number;
  recentCourses: InstructorCoursePerformance[];
}

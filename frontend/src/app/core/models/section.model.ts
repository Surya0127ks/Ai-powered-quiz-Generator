import { LessonType } from './course.model';
export { LessonType };

export interface LessonResource {
  id: string;
  lessonId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSizeByte?: number;
}

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  slug: string;
  type: LessonType;
  content?: string;
  durationMinutes?: number;
  orderIndex: number;
  isFreePreview: boolean;
  createdAtUtc: string;
  resources: LessonResource[];
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  createdAtUtc: string;
  lessons: Lesson[];
}

export interface CreateSectionRequest {
  title: string;
  description?: string;
}

export interface CreateLessonRequest {
  title: string;
  type: LessonType;
  content?: string;
  durationMinutes?: number;
  isFreePreview: boolean;
  resources?: {
    title: string;
    fileUrl: string;
    fileType: string;
    fileSizeByte?: number;
  }[];
}

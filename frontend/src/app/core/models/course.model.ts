export enum CourseLevel {
  Beginner = 1,
  Intermediate = 2,
  Advanced = 3,
  AllLevels = 4
}

export enum CourseStatus {
  Draft = 0,
  Published = 1,
  Archived = 2
}

export enum LessonType {
  Video = 1,
  Text = 2,
  Quiz = 3,
  Assignment = 4,
  Attachment = 5
}

export enum QuestionType {
  SingleChoice = 1,
  MultipleChoice = 2,
  TrueFalse = 3
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  parentCategoryId?: string;
  isActive: boolean;
}

export interface CourseTag {
  id: string;
  name: string;
  slug: string;
}

export interface Course {
  id: string;
  tenantId: string;
  instructorId: string;
  instructorName: string;
  categoryId: string;
  categoryName: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  level: CourseLevel;
  language: string;
  thumbnailUrl?: string;
  price: number;
  discountPrice?: number;
  isFree: boolean;
  currency: string;
  status: CourseStatus;
  createdAtUtc: string;
  tags: CourseTag[];
}

export interface CourseSummary {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  slug: string;
  shortDescription: string;
  level: CourseLevel;
  language: string;
  thumbnailUrl?: string;
  price: number;
  discountPrice?: number;
  isFree: boolean;
  currency: string;
  status: CourseStatus;
  createdAtUtc: string;
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CourseFilterParams {
  searchTerm?: string;
  categoryId?: string;
  level?: CourseLevel;
  language?: string;
  status?: CourseStatus;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateCourseRequest {
  categoryId: string;
  title: string;
  shortDescription: string;
  description: string;
  level: CourseLevel;
  language: string;
  thumbnailUrl?: string;
  price: number;
  discountPrice?: number;
  isFree: boolean;
  currency: string;
  tags?: string[];
}

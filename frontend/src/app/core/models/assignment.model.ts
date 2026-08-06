export enum SubmissionStatus {
  Pending = 1,
  Graded = 2,
  ResubmissionRequired = 3
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content?: string;
  attachmentUrl?: string;
  submittedAtUtc: string;
  status: SubmissionStatus;
  earnedMarks?: number;
  feedback?: string;
  gradedAtUtc?: string;
}

export interface Assignment {
  id: string;
  lessonId: string;
  title: string;
  instructions: string;
  maxMarks: number;
  dueDateUtc?: string;
  attachmentUrl?: string;
  mySubmission?: AssignmentSubmission;
}

export interface SubmitAssignmentRequest {
  content?: string;
  attachmentUrl?: string;
}

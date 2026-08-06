namespace LMS.Application.Features.Student.DTOs;

public record StudentEnrollmentProgressItemDto(
    Guid CourseId,
    string CourseTitle,
    string? ThumbnailUrl,
    double ProgressPercentage,
    int CompletedLessonsCount,
    int TotalLessonsCount,
    Guid? LastLessonId,
    string? LastLessonTitle
);

public record StudentQuizAttemptSummaryDto(
    Guid QuizId,
    string QuizTitle,
    double ScorePercentage,
    bool IsPassed,
    DateTime AttemptedAt
);

public record StudentAssignmentSubmissionSummaryDto(
    Guid AssignmentId,
    string AssignmentTitle,
    string Status,
    int? Grade,
    DateTime SubmittedAt
);

public record StudentCertificateSummaryDto(
    Guid CertificateId,
    Guid CourseId,
    string CourseTitle,
    string CertificateCode,
    DateTime IssuedAt
);

public record StudentDashboardSummaryDto(
    int TotalEnrolledCourses,
    int CompletedCoursesCount,
    int TotalCertificatesEarned,
    int TotalLessonsCompleted,
    int TotalWatchTimeMinutes,
    List<StudentEnrollmentProgressItemDto> ActiveEnrollmentItems,
    List<StudentQuizAttemptSummaryDto> QuizAttemptSummaries,
    List<StudentAssignmentSubmissionSummaryDto> AssignmentSubmissionSummaries,
    List<StudentCertificateSummaryDto> CertificateSummaries
);

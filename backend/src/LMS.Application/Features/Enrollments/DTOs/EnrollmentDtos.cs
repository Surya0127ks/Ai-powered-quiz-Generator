using LMS.Domain.Enums;

namespace LMS.Application.Features.Enrollments.DTOs;

public record EnrollmentDto(
    Guid Id,
    Guid UserId,
    Guid CourseId,
    string CourseTitle,
    string CourseSlug,
    string? CourseThumbnailUrl,
    DateTime EnrolledAtUtc,
    EnrollmentStatus Status,
    DateTime? CompletedAtUtc,
    double ProgressPercentage,
    int CompletedLessonsCount,
    int TotalLessonsCount
);

public record CourseAccessDto(
    Guid CourseId,
    bool IsEnrolled,
    bool IsFreeCourse,
    EnrollmentStatus? Status,
    bool CanAccess
);

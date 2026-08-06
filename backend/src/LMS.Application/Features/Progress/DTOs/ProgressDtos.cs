using LMS.Domain.Enums;

namespace LMS.Application.Features.Progress.DTOs;

public record StudentProgressSummaryDto(
    int TotalEnrolledCourses,
    int TotalCompletedCourses,
    int TotalLessonsCompleted,
    double TotalWatchTimeMinutes,
    double OverallCompletionPercentage,
    List<RecentCompletionItemDto> RecentCompletions,
    List<CourseProgressOverviewDto> CourseOverviews
);

public record RecentCompletionItemDto(
    Guid LessonId,
    string LessonTitle,
    string CourseTitle,
    LessonType LessonType,
    DateTime CompletedAtUtc
);

public record CourseProgressOverviewDto(
    Guid CourseId,
    string CourseTitle,
    string? CourseThumbnailUrl,
    int TotalLessons,
    int CompletedLessons,
    double ProgressPercentage,
    DateTime LastActivityAtUtc
);

public record CourseProgressDetailDto(
    Guid CourseId,
    string CourseTitle,
    int TotalLessons,
    int CompletedLessons,
    double ProgressPercentage,
    List<LessonCompletionStatusDto> Lessons
);

public record LessonCompletionStatusDto(
    Guid LessonId,
    Guid SectionId,
    string LessonTitle,
    LessonType Type,
    int? DurationMinutes,
    bool IsCompleted,
    DateTime? CompletedAtUtc
);

using LMS.Domain.Enums;

namespace LMS.Application.Features.Instructor.DTOs;

public record InstructorDashboardSummaryDto(
    int TotalCourses,
    int PublishedCoursesCount,
    int DraftCoursesCount,
    int TotalEnrolledStudents,
    int TotalCompletedEnrollments,
    decimal TotalEarnings,
    double AverageCompletionRate,
    List<InstructorCoursePerformanceDto> RecentCourses
);

public record InstructorCoursePerformanceDto(
    Guid CourseId,
    string Title,
    string CategoryName,
    CourseLevel Level,
    CourseStatus Status,
    decimal Price,
    int TotalEnrolledStudents,
    int CompletedStudentsCount,
    double CompletionRate,
    DateTime CreatedAtUtc
);

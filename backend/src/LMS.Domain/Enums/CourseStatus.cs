namespace LMS.Domain.Enums;

/// <summary>
/// Defines the lifecycle status of a course.
/// </summary>
public enum CourseStatus
{
    /// <summary>
    /// Initial draft state, visible only to instructor/admin.
    /// </summary>
    Draft = 0,

    /// <summary>
    /// Published and open for student enrollment.
    /// </summary>
    Published = 1,

    /// <summary>
    /// Archived course, closed for new enrollments.
    /// </summary>
    Archived = 2
}

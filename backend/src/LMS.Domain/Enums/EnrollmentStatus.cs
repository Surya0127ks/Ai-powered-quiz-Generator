namespace LMS.Domain.Enums;

/// <summary>
/// Defines the status of a student's course enrollment.
/// </summary>
public enum EnrollmentStatus
{
    /// <summary>
    /// Student is actively enrolled and can access content.
    /// </summary>
    Active = 1,

    /// <summary>
    /// Student completed all course content.
    /// </summary>
    Completed = 2,

    /// <summary>
    /// Student cancelled or dropped enrollment.
    /// </summary>
    Cancelled = 3,

    /// <summary>
    /// Enrollment duration expired.
    /// </summary>
    Expired = 4
}

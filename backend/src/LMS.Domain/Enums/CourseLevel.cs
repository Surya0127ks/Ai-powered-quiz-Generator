namespace LMS.Domain.Enums;

/// <summary>
/// Defines the target difficulty level for a course.
/// </summary>
public enum CourseLevel
{
    /// <summary>
    /// Suitable for beginners with no prior knowledge.
    /// </summary>
    Beginner = 1,

    /// <summary>
    /// Suitable for learners with foundational understanding.
    /// </summary>
    Intermediate = 2,

    /// <summary>
    /// Suitable for advanced practitioners.
    /// </summary>
    Advanced = 3,

    /// <summary>
    /// Designed for all skill levels.
    /// </summary>
    AllLevels = 4
}

namespace LMS.Domain.Enums;

/// <summary>
/// Defines the type of content contained within a lesson.
/// </summary>
public enum LessonType
{
    /// <summary>
    /// Video lecture lesson.
    /// </summary>
    Video = 1,

    /// <summary>
    /// Reading / Article lesson (HTML or Markdown).
    /// </summary>
    Text = 2,

    /// <summary>
    /// Interactive quiz assessment.
    /// </summary>
    Quiz = 3,

    /// <summary>
    /// Hands-on submission assignment.
    /// </summary>
    Assignment = 4,

    /// <summary>
    /// Downloadable resource file.
    /// </summary>
    Attachment = 5
}

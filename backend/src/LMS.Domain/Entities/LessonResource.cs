using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a downloadable resource or attachment associated with a lesson.
/// </summary>
public class LessonResource : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid LessonId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string FileType { get; set; } = "pdf";
    public long? FileSizeByte { get; set; }

    // Navigation property
    public Lesson Lesson { get; set; } = null!;
}

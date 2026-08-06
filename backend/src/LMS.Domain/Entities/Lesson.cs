using LMS.Domain.Common;
using LMS.Domain.Enums;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a lesson item within a course section.
/// </summary>
public class Lesson : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid SectionId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public LessonType Type { get; set; } = LessonType.Video;
    public string? Content { get; set; }
    public int? DurationMinutes { get; set; }
    public int OrderIndex { get; set; }
    public bool IsFreePreview { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Navigation properties
    public Section Section { get; set; } = null!;
    public ICollection<LessonResource> Resources { get; set; } = new List<LessonResource>();
}

using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a section (module/chapter) within a course.
/// </summary>
public class Section : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid CourseId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Navigation properties
    public Course Course { get; set; } = null!;
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
}

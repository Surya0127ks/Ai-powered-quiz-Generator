using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Tracks manual or system lesson completion events for a student.
/// </summary>
public class LessonCompletion : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public Guid LessonId { get; set; }

    public DateTimeOffset CompletedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public bool IsCompleted { get; set; } = true;

    // Navigation properties
    public User User { get; set; } = null!;
    public Lesson Lesson { get; set; } = null!;
}

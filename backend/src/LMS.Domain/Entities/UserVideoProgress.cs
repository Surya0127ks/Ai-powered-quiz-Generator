using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Tracks a student's watching position and completion progress for a video lesson.
/// </summary>
public class UserVideoProgress : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public Guid LessonId { get; set; }

    public int LastWatchedPositionSeconds { get; set; }
    public int TotalDurationSeconds { get; set; }
    public bool IsCompleted { get; set; }
    public DateTimeOffset LastWatchedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Lesson Lesson { get; set; } = null!;
}

using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a coursework assignment associated with a lesson.
/// </summary>
public class Assignment : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid LessonId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public int MaxMarks { get; set; } = 100;
    public DateTimeOffset? DueDateUtc { get; set; }
    public string? AttachmentUrl { get; set; } // Instructor guide or asset template

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Navigation properties
    public Lesson Lesson { get; set; } = null!;
    public ICollection<AssignmentSubmission> Submissions { get; set; } = new List<AssignmentSubmission>();
}

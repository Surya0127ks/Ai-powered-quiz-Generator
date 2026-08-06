using LMS.Domain.Common;
using LMS.Domain.Enums;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a student's submission for an assignment and instructor evaluation.
/// </summary>
public class AssignmentSubmission : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid AssignmentId { get; set; }
    public Guid StudentId { get; set; }

    public string? Content { get; set; }
    public string? AttachmentUrl { get; set; } // Cloudinary / storage file submission placeholder
    public DateTimeOffset SubmittedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public SubmissionStatus Status { get; set; } = SubmissionStatus.Pending;
    public int? EarnedMarks { get; set; }
    public string? Feedback { get; set; }
    public Guid? GradedBy { get; set; }
    public DateTimeOffset? GradedAtUtc { get; set; }

    // Navigation properties
    public Assignment Assignment { get; set; } = null!;
    public User Student { get; set; } = null!;
}

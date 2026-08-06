using LMS.Domain.Common;
using LMS.Domain.Enums;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a student's enrollment in a course.
/// </summary>
public class Enrollment : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public Guid CourseId { get; set; }

    public DateTimeOffset EnrolledAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;
    public DateTimeOffset? CompletedAtUtc { get; set; }
    public DateTimeOffset? ExpiresAtUtc { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Course Course { get; set; } = null!;
}

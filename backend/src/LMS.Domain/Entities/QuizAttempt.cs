using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Tracks a student's attempt at completing a quiz.
/// </summary>
public class QuizAttempt : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; } // Nullable for public students
    public Guid QuizId { get; set; }

    // Student Details
    public string? StudentName { get; set; }
    public string? RollNumber { get; set; }
    public string? ClassName { get; set; }
    public string? Department { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public double ScorePercentage { get; set; }
    public int TotalPointsEarned { get; set; }
    public int TotalPossiblePoints { get; set; }
    public bool IsPassed { get; set; }
    public int FocusLostCount { get; set; }
    public bool IsDisqualified { get; set; }

    public DateTimeOffset StartedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? SubmittedAtUtc { get; set; }

    // Navigation properties
    public User? User { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public ICollection<QuizAttemptAnswer> Answers { get; set; } = new List<QuizAttemptAnswer>();
}

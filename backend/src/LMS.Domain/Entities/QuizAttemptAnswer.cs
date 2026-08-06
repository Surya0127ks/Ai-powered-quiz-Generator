using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Records a student's answer selection for a specific question in a quiz attempt.
/// </summary>
public class QuizAttemptAnswer : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid AttemptId { get; set; }
    public Guid QuestionId { get; set; }

    public Guid? SelectedOptionId { get; set; }
    public string? SelectedOptionIdsJson { get; set; }
    public bool IsCorrect { get; set; }
    public int PointsEarned { get; set; }

    // Navigation properties
    public QuizAttempt Attempt { get; set; } = null!;
    public QuizQuestion Question { get; set; } = null!;
}

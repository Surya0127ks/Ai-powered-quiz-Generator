using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a selectable answer option for a quiz question.
/// </summary>
public class QuizOption : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid QuestionId { get; set; }

    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }

    // Navigation property
    public QuizQuestion Question { get; set; } = null!;
}

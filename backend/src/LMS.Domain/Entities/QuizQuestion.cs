using LMS.Domain.Common;
using LMS.Domain.Enums;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a single question item inside a quiz.
/// </summary>
public class QuizQuestion : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid QuizId { get; set; }

    public string QuestionText { get; set; } = string.Empty;
    public QuestionType Type { get; set; } = QuestionType.SingleChoice;
    public int Points { get; set; } = 1;
    public int OrderIndex { get; set; }
    public string? Explanation { get; set; }

    // Navigation properties
    public Quiz Quiz { get; set; } = null!;
    public ICollection<QuizOption> Options { get; set; } = new List<QuizOption>();
}

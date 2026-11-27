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
    public string? Tag { get; set; }

    // Navigation properties
    public Quiz Quiz { get; set; } = null!;
    public ICollection<QuizOption> Options { get; set; } = new List<QuizOption>();

    public static string? NormalizeTag(string? rawTag)
    {
        if (string.IsNullOrWhiteSpace(rawTag))
        {
            return null;
        }

        var trimmed = rawTag.Trim();
        return trimmed.Length > 60 ? trimmed[..60] : trimmed;
    }
}

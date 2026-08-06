using LMS.Domain.Common;
using LMS.Domain.Enums;

namespace LMS.Domain.Entities;

public class QuestionBankItem : BaseEntity
{
    public Guid DomainTopicId { get; set; }
    public Guid? SubTopicId { get; set; }

    public string QuestionText { get; set; } = string.Empty;
    public QuestionType Type { get; set; } = QuestionType.SingleChoice;
    public string Difficulty { get; set; } = "Medium";
    public int Points { get; set; } = 1;
    public string? Explanation { get; set; }

    public DomainTopic DomainTopic { get; set; } = null!;
    public SubTopic? SubTopic { get; set; }
    public ICollection<QuestionBankOption> Options { get; set; } = new List<QuestionBankOption>();
}

public class QuestionBankOption : BaseEntity
{
    public Guid QuestionBankItemId { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }

    public QuestionBankItem QuestionBankItem { get; set; } = null!;
}

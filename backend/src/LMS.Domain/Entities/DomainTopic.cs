using LMS.Domain.Common;

namespace LMS.Domain.Entities;

public class DomainTopic : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<SubTopic> SubTopics { get; set; } = new List<SubTopic>();
    public ICollection<QuestionBankItem> Questions { get; set; } = new List<QuestionBankItem>();
}

public class SubTopic : BaseEntity
{
    public Guid DomainTopicId { get; set; }
    public string Name { get; set; } = string.Empty;

    public DomainTopic DomainTopic { get; set; } = null!;
    public ICollection<QuestionBankItem> Questions { get; set; } = new List<QuestionBankItem>();
}

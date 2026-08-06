using LMS.Domain.Enums;

namespace LMS.Application.Features.QuestionBank.DTOs;

public record SubTopicDto(
    Guid Id,
    string Name
);

public record DomainTopicDto(
    Guid Id,
    string Name,
    string? Description,
    List<SubTopicDto> SubTopics
);

public record GenerateQuestionsRequestDto(
    Guid? DomainTopicId,
    Guid? SubTopicId,
    string? CustomTopic,
    int QuestionCount,
    string? Difficulty,
    string? ApiKey
);

public record GeneratedQuestionOptionDto(
    string OptionText,
    bool IsCorrect
);

public record GeneratedQuestionDto(
    string QuestionText,
    QuestionType Type,
    int Points,
    string? Explanation,
    List<GeneratedQuestionOptionDto> Options
);

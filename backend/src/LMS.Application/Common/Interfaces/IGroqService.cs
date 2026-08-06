using LMS.Application.Common.Models;
using LMS.Application.Features.QuestionBank.DTOs;

namespace LMS.Application.Common.Interfaces;

public interface IGroqService
{
    Task<Result<List<GeneratedQuestionDto>>> GenerateQuestionsAsync(
        string topic,
        string? subTopic,
        int count,
        string? difficulty,
        string? customApiKey = null,
        CancellationToken cancellationToken = default);
}

using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.QuestionBank.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.QuestionBank.Queries.GenerateQuestions;

public record GenerateQuestionsQuery(
    Guid? DomainTopicId,
    Guid? SubTopicId,
    string? CustomTopic,
    int QuestionCount,
    string? Difficulty,
    string? ApiKey
) : IRequest<Result<List<GeneratedQuestionDto>>>;

public class GenerateQuestionsQueryHandler : IRequestHandler<GenerateQuestionsQuery, Result<List<GeneratedQuestionDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IGroqService _groqService;

    public GenerateQuestionsQueryHandler(IApplicationDbContext context, IGroqService groqService)
    {
        _context = context;
        _groqService = groqService;
    }

    public async Task<Result<List<GeneratedQuestionDto>>> Handle(GenerateQuestionsQuery request, CancellationToken cancellationToken)
    {
        if (request.QuestionCount is < 1 or > 30)
        {
            return Result.Failure<List<GeneratedQuestionDto>>("Question count must be between 1 and 30 (Groq free-tier limit).");
        }

        if (request.ApiKey?.Length > 256)
        {
            return Result.Failure<List<GeneratedQuestionDto>>("The supplied API key is invalid.");
        }

        string topicName = !string.IsNullOrWhiteSpace(request.CustomTopic) ? request.CustomTopic.Trim() : "General Knowledge";
        string? subTopicName = null;

        if (request.DomainTopicId.HasValue && request.DomainTopicId.Value != Guid.Empty)
        {
            try
            {
                var domain = await _context.DomainTopics
                    .Include(d => d.SubTopics)
                    .FirstOrDefaultAsync(d => d.Id == request.DomainTopicId.Value, cancellationToken);

                if (domain != null)
                {
                    topicName = domain.Name;
                    if (request.SubTopicId.HasValue)
                    {
                        var sub = domain.SubTopics.FirstOrDefault(s => s.Id == request.SubTopicId.Value);
                        if (sub != null)
                        {
                            subTopicName = sub.Name;
                        }
                    }
                }
            }
            catch (Exception)
            {
                // Fallback to custom topic if table does not exist
            }
        }

        // Live Groq AI Question Generation (Strictly AI, no static/template fallback)
        var aiResult = await _groqService.GenerateQuestionsAsync(
            topicName,
            subTopicName,
            request.QuestionCount > 0 ? request.QuestionCount : 5,
            request.Difficulty,
            request.ApiKey,
            cancellationToken
        );

        return aiResult;
    }
}

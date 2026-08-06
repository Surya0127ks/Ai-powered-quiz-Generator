using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Quizzes.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Queries.GetQuizAttemptById;

public record GetQuizAttemptByIdQuery(Guid AttemptId) : IRequest<Result<AdminAttemptDetailsDto>>;

public class GetQuizAttemptByIdQueryHandler : IRequestHandler<GetQuizAttemptByIdQuery, Result<AdminAttemptDetailsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetQuizAttemptByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<AdminAttemptDetailsDto>> Handle(GetQuizAttemptByIdQuery request, CancellationToken cancellationToken)
    {
        var attempt = await _context.QuizAttempts
            .Include(qa => qa.User)
            .Include(qa => qa.Quiz)
                .ThenInclude(q => q.Questions)
                    .ThenInclude(q => q.Options)
            .Include(qa => qa.Answers)
            .FirstOrDefaultAsync(qa => qa.Id == request.AttemptId, cancellationToken);

        if (attempt == null)
        {
            return Result.Failure<AdminAttemptDetailsDto>("Attempt not found.");
        }

        var studentName = !string.IsNullOrWhiteSpace(attempt.StudentName) 
            ? attempt.StudentName 
            : attempt.User != null ? $"{attempt.User.FirstName} {attempt.User.LastName}".Trim() : "Unknown Student";
            
        var email = !string.IsNullOrWhiteSpace(attempt.Email) 
            ? attempt.Email 
            : attempt.User?.Email ?? "No Email";

        var questionDtos = new List<AdminAttemptQuestionDto>();

        foreach (var question in attempt.Quiz.Questions.OrderBy(q => q.OrderIndex))
        {
            var answer = attempt.Answers.FirstOrDefault(a => a.QuestionId == question.Id);
            
            var optionDtos = question.Options.OrderBy(o => o.OrderIndex).Select(o => new AdminAttemptOptionDto(
                o.Id,
                o.OptionText,
                o.IsCorrect
            )).ToList();

            var selectedOptionIds = new List<Guid>();
            if (answer != null)
            {
                if (answer.SelectedOptionId.HasValue)
                {
                    selectedOptionIds.Add(answer.SelectedOptionId.Value);
                }
                else if (!string.IsNullOrEmpty(answer.SelectedOptionIdsJson))
                {
                    try
                    {
                        var ids = System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(answer.SelectedOptionIdsJson);
                        if (ids != null)
                        {
                            selectedOptionIds.AddRange(ids);
                        }
                    }
                    catch { }
                }
            }

            questionDtos.Add(new AdminAttemptQuestionDto(
                question.Id,
                question.QuestionText,
                question.Points,
                answer?.PointsEarned ?? 0,
                answer?.IsCorrect ?? false,
                optionDtos,
                selectedOptionIds,
                question.Explanation
            ));
        }

        var dto = new AdminAttemptDetailsDto(
            attempt.Id,
            attempt.QuizId,
            attempt.Quiz.Title,
            studentName,
            email,
            attempt.RollNumber,
            attempt.ClassName,
            attempt.Department,
            Math.Round(attempt.ScorePercentage, 1),
            attempt.TotalPointsEarned,
            attempt.TotalPossiblePoints,
            attempt.IsPassed,
            attempt.SubmittedAtUtc,
            attempt.FocusLostCount,
            questionDtos
        );

        return Result<AdminAttemptDetailsDto>.Success(dto);
    }
}

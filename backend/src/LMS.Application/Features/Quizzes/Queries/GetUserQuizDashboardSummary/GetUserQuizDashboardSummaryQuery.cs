using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Quizzes.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Queries.GetUserQuizDashboardSummary;

public record GetUserQuizDashboardSummaryQuery(Guid UserId) : IRequest<Result<UserQuizDashboardSummaryDto>>;

public class GetUserQuizDashboardSummaryQueryHandler : IRequestHandler<GetUserQuizDashboardSummaryQuery, Result<UserQuizDashboardSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetUserQuizDashboardSummaryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<UserQuizDashboardSummaryDto>> Handle(GetUserQuizDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        // 1. Quizzes created by current user
        var createdQuizzes = await _context.Quizzes
            .Include(q => q.Questions)
            .Where(q => q.CreatedByUserId == request.UserId && !q.IsDeleted)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync(cancellationToken);

        int quizzesCreatedCount = createdQuizzes.Count;
        int publishedCount = createdQuizzes.Count(q => q.IsPublished);
        int draftsCount = quizzesCreatedCount - publishedCount;

        var createdQuizIds = createdQuizzes.Select(q => q.Id).ToList();

        // Attempts on quizzes created by user
        var attemptsOnUserQuizzes = await _context.QuizAttempts
            .Where(qa => createdQuizIds.Contains(qa.QuizId))
            .ToListAsync(cancellationToken);

        var myQuizzesList = new List<UserQuizItemDto>();
        foreach (var q in createdQuizzes)
        {
            var qAttempts = attemptsOnUserQuizzes.Where(a => a.QuizId == q.Id).ToList();
            int qAttemptCount = qAttempts.Count;
            double qAvgScore = qAttemptCount > 0 ? Math.Round(qAttempts.Average(a => a.ScorePercentage), 1) : 0;

            myQuizzesList.Add(new UserQuizItemDto(
                q.Id,
                q.Title,
                q.Category ?? "General",
                q.Difficulty ?? "Intermediate",
                q.Questions.Count,
                q.TimeLimitMinutes,
                q.IsPublished,
                qAttemptCount,
                qAvgScore,
                q.CreatedAt.UtcDateTime,
                q.ShortId
            ));
        }

        // 2. Attempts taken by user
        var userAttempts = await _context.QuizAttempts
            .Include(qa => qa.Quiz)
            .Where(qa => qa.UserId == request.UserId)
            .OrderByDescending(qa => qa.SubmittedAtUtc ?? qa.StartedAtUtc)
            .ToListAsync(cancellationToken);

        int totalAttemptsCount = userAttempts.Count;
        double avgScorePercentage = totalAttemptsCount > 0 ? Math.Round(userAttempts.Average(a => a.ScorePercentage), 1) : 0;
        int certificatesEarned = userAttempts.Count(a => a.IsPassed);

        var myAttemptsList = userAttempts.Select(a => new UserAttemptItemDto(
            a.Id,
            a.QuizId,
            a.Quiz?.Title ?? "Quiz Assessment",
            a.ScorePercentage,
            a.IsPassed,
            (a.SubmittedAtUtc ?? a.StartedAtUtc).UtcDateTime
        )).ToList();

        var summary = new UserQuizDashboardSummaryDto(
            quizzesCreatedCount,
            publishedCount,
            draftsCount,
            totalAttemptsCount,
            avgScorePercentage,
            certificatesEarned,
            myQuizzesList,
            myAttemptsList
        );

        return Result.Success(summary);
    }
}

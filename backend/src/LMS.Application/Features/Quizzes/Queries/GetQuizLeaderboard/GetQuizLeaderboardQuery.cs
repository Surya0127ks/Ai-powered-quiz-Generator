using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Quizzes.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Queries.GetQuizLeaderboard;

public record GetQuizLeaderboardQuery(Guid QuizId) : IRequest<Result<List<QuizLeaderboardItemDto>>>;

public class GetQuizLeaderboardQueryHandler : IRequestHandler<GetQuizLeaderboardQuery, Result<List<QuizLeaderboardItemDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetQuizLeaderboardQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<QuizLeaderboardItemDto>>> Handle(GetQuizLeaderboardQuery request, CancellationToken cancellationToken)
    {
        var quiz = await _context.Quizzes
            .Where(q => q.Id == request.QuizId && !q.IsDeleted)
            .Select(q => new { q.CreatedByUserId })
            .FirstOrDefaultAsync(cancellationToken);

        if (quiz == null)
        {
            return Result.Failure<List<QuizLeaderboardItemDto>>("Quiz assessment not found.");
        }

        if (_currentUserService.UserId is not { } userId || quiz.CreatedByUserId != userId)
        {
            return Result.Failure<List<QuizLeaderboardItemDto>>("You can only review results for quizzes you created.");
        }

        var attempts = await _context.QuizAttempts
            .Include(qa => qa.User)
            .Where(qa => qa.QuizId == request.QuizId && qa.SubmittedAtUtc != null &&
                (!quiz.CreatedByUserId.HasValue || qa.UserId != quiz.CreatedByUserId.Value))
            .OrderByDescending(qa => qa.ScorePercentage)
            .ThenBy(qa => qa.SubmittedAtUtc)
            .ToListAsync(cancellationToken);

        var leaderboard = new List<QuizLeaderboardItemDto>();
        int rank = 1;

        foreach (var attempt in attempts)
        {
            string studentName = !string.IsNullOrWhiteSpace(attempt.StudentName)
                ? attempt.StudentName.Trim()
                : (attempt.User != null ? $"{attempt.User.FirstName} {attempt.User.LastName}".Trim() : "Student Learner");

            if (string.IsNullOrWhiteSpace(studentName))
            {
                studentName = attempt.User?.Email ?? "Student Learner";
            }

            leaderboard.Add(new QuizLeaderboardItemDto(
                attempt.Id,
                attempt.UserId ?? Guid.Empty,
                studentName,
                attempt.User?.Email ?? attempt.Email ?? "student@quizhub.com",
                Math.Round(attempt.ScorePercentage, 1),
                attempt.TotalPointsEarned,
                attempt.TotalPossiblePoints,
                attempt.IsPassed,
                attempt.SubmittedAtUtc?.UtcDateTime ?? attempt.CreatedAt.UtcDateTime,
                rank++,
                attempt.FocusLostCount
            ));
        }

        return Result<List<QuizLeaderboardItemDto>>.Success(leaderboard);
    }
}

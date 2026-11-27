using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Quizzes.DTOs;
using LMS.Domain.Enums;
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
            .Select(q => new
            {
                q.CreatedByUserId,
                CreatorRole = q.CreatedByUser != null ? (UserRole?)q.CreatedByUser.Role : null
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (quiz == null)
        {
            return Result.Failure<List<QuizLeaderboardItemDto>>("Quiz assessment not found.");
        }

        if (_currentUserService.UserId is not { } userId || quiz.CreatedByUserId != userId)
        {
            return Result.Failure<List<QuizLeaderboardItemDto>>("You can only review results for quizzes you created.");
        }

        // For Student-created practice quizzes, return that student's chronological attempts (Attempt #1, #2, ...) instead of a public leaderboard.
        bool isStudentCreator = quiz.CreatorRole == UserRole.Student;
        var baseQuery = _context.QuizAttempts
            .Include(qa => qa.User)
            .Where(qa => qa.QuizId == request.QuizId && qa.SubmittedAtUtc != null);

        var filteredQuery = isStudentCreator
            ? baseQuery.Where(qa => qa.UserId == userId).OrderBy(qa => qa.SubmittedAtUtc)
            : baseQuery.Where(qa => !quiz.CreatedByUserId.HasValue || qa.UserId != quiz.CreatedByUserId.Value)
                .OrderByDescending(qa => qa.ScorePercentage)
                .ThenBy(qa => qa.SubmittedAtUtc);

        var attempts = await filteredQuery.ToListAsync(cancellationToken);

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
                attempt.FocusLostCount,
                attempt.TimeTakenSeconds
            ));
        }

        return Result<List<QuizLeaderboardItemDto>>.Success(leaderboard);
    }
}

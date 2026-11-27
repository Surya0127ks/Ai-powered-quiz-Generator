using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LMS.Infrastructure.Services;

/// <summary>
/// Permanently purges standalone quizzes and all related data after the free-tier retention window.
/// </summary>
public static class QuizDataCleanupHelper
{
    public static readonly TimeSpan DefaultQuizRetentionPeriod = TimeSpan.FromHours(24);

    public static async Task<int> PurgeExpiredQuizzesAsync(
        ApplicationDbContext dbContext,
        TimeSpan? retentionPeriod = null,
        CancellationToken cancellationToken = default)
    {
        var retention = retentionPeriod ?? DefaultQuizRetentionPeriod;
        var cutoffUtc = DateTimeOffset.UtcNow.Subtract(retention);

        if (dbContext.Database.IsRelational())
        {
            // Cascade delete removes QuizQuestions, QuizOptions, QuizAttempts, QuizAttemptAnswers, and Certificates.
            return await dbContext.Quizzes
                .IgnoreQueryFilters()
                .Where(q => q.IsDeleted || (q.LessonId == null && q.CreatedAt <= cutoffUtc))
                .ExecuteDeleteAsync(cancellationToken);
        }

        var expiredQuizzes = await dbContext.Quizzes
            .IgnoreQueryFilters()
            .Include(q => q.Questions)
                .ThenInclude(ques => ques.Options)
            .Where(q => q.IsDeleted || (q.LessonId == null && q.CreatedAt <= cutoffUtc))
            .ToListAsync(cancellationToken);

        if (expiredQuizzes.Count == 0)
        {
            return 0;
        }

        var expiredQuizIds = expiredQuizzes.Select(q => q.Id).ToList();
        var attempts = await dbContext.QuizAttempts
            .Include(a => a.Answers)
            .Where(a => expiredQuizIds.Contains(a.QuizId))
            .ToListAsync(cancellationToken);
        var certificates = await dbContext.Certificates
            .IgnoreQueryFilters()
            .Where(c => c.QuizId.HasValue && expiredQuizIds.Contains(c.QuizId.Value))
            .ToListAsync(cancellationToken);

        dbContext.Certificates.RemoveRange(certificates);
        dbContext.QuizAttemptAnswers.RemoveRange(attempts.SelectMany(a => a.Answers));
        dbContext.QuizAttempts.RemoveRange(attempts);
        dbContext.QuizOptions.RemoveRange(expiredQuizzes.SelectMany(q => q.Questions).SelectMany(qq => qq.Options));
        dbContext.QuizQuestions.RemoveRange(expiredQuizzes.SelectMany(q => q.Questions));
        dbContext.Quizzes.RemoveRange(expiredQuizzes);

        await dbContext.SaveChangesAsync(cancellationToken);
        return expiredQuizzes.Count;
    }
}

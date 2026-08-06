using LMS.Application.Common.Interfaces;
#pragma warning disable CA1848
#pragma warning disable CA1860
using Microsoft.EntityFrameworkCore;

namespace LMS.Api.BackgroundServices;

public class QuizCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<QuizCleanupService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(15);
    private readonly TimeSpan _cleanupThreshold = TimeSpan.FromHours(1);

    public QuizCleanupService(IServiceProvider serviceProvider, ILogger<QuizCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Quiz Cleanup Service is starting.");

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupOldUnattemptedQuizzesAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    _logger.LogInformation("Quiz Cleanup Service cancellation requested during cleanup.");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing quiz cleanup.");
                }

                try
                {
                    await Task.Delay(_checkInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Quiz Cleanup Service cancellation requested during delay.");
                    break;
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Quiz Cleanup Service cancellation requested.");
        }
        finally
        {
            _logger.LogInformation("Quiz Cleanup Service is stopping.");
        }
    }

    private async Task CleanupOldUnattemptedQuizzesAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var thresholdDate = DateTimeOffset.UtcNow.Subtract(_cleanupThreshold);

        // Find quizzes created before the threshold that are not yet deleted
        // and have 0 attempts.
        var abandonedQuizzes = await context.Quizzes
            .Where(q => !q.IsDeleted && q.CreatedAt <= thresholdDate)
            .Where(q => !context.QuizAttempts.Any(a => a.QuizId == q.Id))
            .ToListAsync(cancellationToken);

        if (abandonedQuizzes.Any())
        {
            foreach (var quiz in abandonedQuizzes)
            {
                quiz.IsDeleted = true;
                quiz.DeletedAt = DateTimeOffset.UtcNow;
                _logger.LogInformation("Auto-deleting abandoned quiz {QuizId} '{Title}'", quiz.Id, quiz.Title);
            }

            context.Quizzes.UpdateRange(abandonedQuizzes);
            await context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully cleaned up {Count} abandoned quizzes.", abandonedQuizzes.Count);
        }
    }
}

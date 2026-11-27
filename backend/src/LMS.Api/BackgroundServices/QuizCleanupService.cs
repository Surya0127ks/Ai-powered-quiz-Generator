using LMS.Infrastructure.Persistence;
using LMS.Infrastructure.Services;
#pragma warning disable CA1848
#pragma warning disable CA1860

namespace LMS.Api.BackgroundServices;

public class QuizCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<QuizCleanupService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(15);
    private readonly TimeSpan _cleanupThreshold = QuizDataCleanupHelper.DefaultQuizRetentionPeriod;

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
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var deletedCount = await QuizDataCleanupHelper.PurgeExpiredQuizzesAsync(
            context,
            _cleanupThreshold,
            cancellationToken);

        if (deletedCount > 0)
        {
            _logger.LogInformation("Permanently purged {Count} expired or deleted quizzes and all associated data.", deletedCount);
        }
    }
}

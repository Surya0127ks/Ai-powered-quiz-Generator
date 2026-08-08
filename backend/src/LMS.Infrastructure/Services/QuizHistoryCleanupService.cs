#pragma warning disable CA1848
using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace LMS.Infrastructure.Services;

/// <summary>
/// A background service that periodically cleans up old quiz attempts to save memory/storage.
/// </summary>
public class QuizHistoryCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<QuizHistoryCleanupService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(6);
    private readonly TimeSpan _retentionPeriod = TimeSpan.FromHours(24);

    public QuizHistoryCleanupService(
        IServiceProvider serviceProvider,
        ILogger<QuizHistoryCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("QuizHistoryCleanupService is starting. Old quiz attempts will be deleted.");

        // Run the cleanup loop until the application stops
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupOldAttemptsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing QuizHistoryCleanupService.");
            }

            // Wait before checking again
            await Task.Delay(_checkInterval, stoppingToken);
        }
        
        _logger.LogInformation("QuizHistoryCleanupService is stopping.");
    }

    private async Task CleanupOldAttemptsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var thresholdDate = DateTimeOffset.UtcNow.Subtract(_retentionPeriod);

        _logger.LogInformation("Executing cleanup of QuizAttempt records started before {ThresholdDate}", thresholdDate);

        // Delete all quiz attempts older than the threshold.
        // In EF Core 7+, ExecuteDeleteAsync directly executes a DELETE query on the database.
        // It cascades to QuizAttemptAnswer based on standard foreign key constraints.
        var deletedCount = await dbContext.QuizAttempts
            .Where(qa => qa.StartedAtUtc < thresholdDate)
            .ExecuteDeleteAsync(stoppingToken);

        if (deletedCount > 0)
        {
            _logger.LogInformation("Successfully deleted {Count} old quiz attempt records.", deletedCount);
        }
        else
        {
            _logger.LogInformation("No old quiz attempt records found to delete.");
        }
    }
}

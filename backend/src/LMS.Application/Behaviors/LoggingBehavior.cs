using MediatR;
using Microsoft.Extensions.Logging;

namespace LMS.Application.Behaviors;

/// <summary>
/// Pipeline behavior that logs request execution and elapsed time.
/// </summary>
/// <typeparam name="TRequest">The request type.</typeparam>
/// <typeparam name="TResponse">The response type.</typeparam>
public partial class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    [LoggerMessage(EventId = 2001, Level = LogLevel.Information, Message = "Handling {RequestName}")]
    static partial void LogRequestStart(ILogger logger, string requestName);

    [LoggerMessage(EventId = 2002, Level = LogLevel.Information, Message = "Handled {RequestName} in {ElapsedMs}ms")]
    static partial void LogRequestEnd(ILogger logger, string requestName, long elapsedMs);

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;

        LogRequestStart(_logger, requestName);
        var startTime = Environment.TickCount;
        try
        {
            return await next();
        }
        finally
        {
            var elapsedMs = Environment.TickCount - startTime;
            LogRequestEnd(_logger, requestName, elapsedMs);
        }
    }
}
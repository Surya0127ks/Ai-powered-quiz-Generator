using LMS.Api.Extensions;
using LMS.Api.Middleware;
using LMS.Application;
using LMS.Infrastructure;
using Serilog;
using LMS.Api.BackgroundServices;
using Microsoft.Extensions.Hosting;

// --- Serilog bootstrap ---
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(formatProvider: System.Globalization.CultureInfo.InvariantCulture)
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting LMS API host");

    var builder = WebApplication.CreateBuilder(args);

    // --- Serilog ---
    builder.Host.UseSerilog((context, configuration) =>
        configuration.ReadFrom.Configuration(context.Configuration));

    // --- Application & Infrastructure ---
    builder.Services.AddApplicationServices();
    builder.Services.AddInfrastructureServices(builder.Configuration);

    // --- API Services ---
    builder.Services.AddApiServices(builder.Configuration);
    builder.Services.AddHostedService<QuizCleanupService>();

    builder.Host.ConfigureHostOptions(options =>
    {
        options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
    });

    var app = builder.Build();

    // --- Middleware Pipeline ---
    app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
// Enable Swagger in Development and optionally in Production
if (app.Environment.IsDevelopment() ||
    builder.Configuration.GetValue<bool>("EnableSwagger"))
{
    app.UseSwaggerConfiguration();
}
    app.UseHttpsRedirection();
    app.UseCors("DefaultCorsPolicy");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "LMS API host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// Make the implicit Program class public for integration tests
public partial class Program;
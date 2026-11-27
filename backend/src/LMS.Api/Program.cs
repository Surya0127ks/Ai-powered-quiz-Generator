using LMS.Api.Extensions;
using LMS.Api.Middleware;
using LMS.Application;
using LMS.Infrastructure;
using LMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
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

    // Ensure additive quiz tag & attempt duration columns exist when connected to a real database.
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(connectionString) &&
        !connectionString.Contains("PLACEHOLDER_HOST", StringComparison.OrdinalIgnoreCase))
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetService<ApplicationDbContext>();
        if (dbContext != null && dbContext.Database.IsRelational())
        {
            try
            {
                dbContext.Database.SetCommandTimeout(TimeSpan.FromSeconds(5));
                await dbContext.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""QuizQuestions"" ADD COLUMN IF NOT EXISTS ""Tag"" character varying(60);
                    ALTER TABLE ""QuizAttempts"" ADD COLUMN IF NOT EXISTS ""TimeTakenSeconds"" integer;
                ");
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Skipped startup schema sync for QuizQuestions/QuizAttempts");
            }
        }
    }

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
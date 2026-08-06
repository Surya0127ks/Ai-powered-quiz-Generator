using LMS.Application.Common.Interfaces;
using LMS.Domain.Common;
using LMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace LMS.Infrastructure.Persistence;

/// <summary>
/// Entity Framework Core DbContext for the LMS application.
/// Implements IApplicationDbContext to decouple the Application layer from EF Core.
/// </summary>
public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CourseTag> CourseTags => Set<CourseTag>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<LessonResource> LessonResources => Set<LessonResource>();
    public DbSet<VideoMetadata> VideoMetadatas => Set<VideoMetadata>();
    public DbSet<UserVideoProgress> UserVideoProgresses => Set<UserVideoProgress>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<LessonCompletion> LessonCompletions => Set<LessonCompletion>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizOption> QuizOptions => Set<QuizOption>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<QuizAttemptAnswer> QuizAttemptAnswers => Set<QuizAttemptAnswer>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<AssignmentSubmission> AssignmentSubmissions => Set<AssignmentSubmission>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<DomainTopic> DomainTopics => Set<DomainTopic>();
    public DbSet<SubTopic> SubTopics => Set<SubTopic>();
    public DbSet<QuestionBankItem> QuestionBankItems => Set<QuestionBankItem>();
    public DbSet<QuestionBankOption> QuestionBankOptions => Set<QuestionBankOption>();

    /// <inheritdoc/>
    public IQueryable<TEntity> Query<TEntity>() where TEntity : BaseEntity
    {
        return Set<TEntity>().AsNoTracking();
    }

    /// <inheritdoc/>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateAuditableEntities();

        if (ChangeTracker.Entries<Quiz>().Any(e => e.State == EntityState.Added || e.State == EntityState.Modified))
        {
            try
            {
                await RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(Database, @"
                    ALTER TABLE ""Quizzes"" ADD COLUMN IF NOT EXISTS ""Category"" text;
                    ALTER TABLE ""Quizzes"" ADD COLUMN IF NOT EXISTS ""Difficulty"" text;
                    ALTER TABLE ""Quizzes"" ADD COLUMN IF NOT EXISTS ""IsPublished"" boolean DEFAULT true;
                    ALTER TABLE ""Quizzes"" ADD COLUMN IF NOT EXISTS ""CoverImageUrl"" text;
                    ALTER TABLE ""Quizzes"" ADD COLUMN IF NOT EXISTS ""CreatedByUserId"" uuid;
                    ALTER TABLE ""Quizzes"" ALTER COLUMN ""LessonId"" DROP NOT NULL;
                ", cancellationToken);
            }
            catch (Exception) { /* Ignored if columns already exist */ }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Automatically updates audit fields (CreatedAt, ModifiedAt) on save.
    /// </summary>
    private void UpdateAuditableEntities()
    {
        foreach (EntityEntry<AuditableEntity> entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.MarkAsCreated(entry.Entity.CreatedBy);
                    break;
                case EntityState.Modified:
                    entry.Entity.MarkAsModified(entry.Entity.ModifiedBy);
                    break;
            }
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Apply entity configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}
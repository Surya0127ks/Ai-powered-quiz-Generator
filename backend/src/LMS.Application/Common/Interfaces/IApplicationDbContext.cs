using LMS.Domain.Common;
using LMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Common.Interfaces;

/// <summary>
/// Abstraction over the persistence context.
/// Allows the Application layer to interact with persistence without coupling to EF Core directly.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<User> Users { get; }
    DbSet<Category> Categories { get; }
    DbSet<CourseTag> CourseTags { get; }
    DbSet<Course> Courses { get; }
    DbSet<Section> Sections { get; }
    DbSet<Lesson> Lessons { get; }
    DbSet<LessonResource> LessonResources { get; }
    DbSet<VideoMetadata> VideoMetadatas { get; }
    DbSet<UserVideoProgress> UserVideoProgresses { get; }
    DbSet<Enrollment> Enrollments { get; }
    DbSet<LessonCompletion> LessonCompletions { get; }
    DbSet<Quiz> Quizzes { get; }
    DbSet<QuizQuestion> QuizQuestions { get; }
    DbSet<QuizOption> QuizOptions { get; }
    DbSet<QuizAttempt> QuizAttempts { get; }
    DbSet<QuizAttemptAnswer> QuizAttemptAnswers { get; }
    DbSet<Assignment> Assignments { get; }
    DbSet<AssignmentSubmission> AssignmentSubmissions { get; }
    DbSet<Certificate> Certificates { get; }
    DbSet<DomainTopic> DomainTopics { get; }
    DbSet<SubTopic> SubTopics { get; }
    DbSet<QuestionBankItem> QuestionBankItems { get; }
    DbSet<QuestionBankOption> QuestionBankOptions { get; }

    /// <summary>
    /// Gets a queryable set of entities for the specified type.
    /// </summary>
    /// <typeparam name="TEntity">The entity type.</typeparam>
    /// <returns>An IQueryable of entities.</returns>
    IQueryable<TEntity> Query<TEntity>() where TEntity : BaseEntity;

    /// <summary>
    /// Saves all changes made in this context to the database.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The number of state entries written to the database.</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
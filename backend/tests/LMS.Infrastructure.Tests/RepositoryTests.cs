using LMS.Domain.Common;
using LMS.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace LMS.Infrastructure.Tests;

/// <summary>
/// Unit tests for the generic Repository using an in-memory database.
/// </summary>
public class RepositoryTests
{
    [Fact]
    public async Task AddAsync_ShouldAddEntityToContext()
    {
        // Arrange
        var context = GetInMemoryContext();
        var repository = new Repository<TestEntity>(context);

        // Act
        repository.Add(new TestEntity());
        await context.SaveChangesAsync();

        // Assert
        var entities = await context.Set<TestEntity>().ToListAsync();
        entities.Should().HaveCount(1);
    }

    private static TestDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestDbContext(options);
    }

    /// <summary>
    /// Test-specific DbContext that registers the TestEntity.
    /// </summary>
    private sealed class TestDbContext : DbContext
    {
        public TestDbContext(DbContextOptions<TestDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TestEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();
            });
        }
    }

    /// <summary>
    /// Test entity for repository tests.
    /// </summary>
    private sealed class TestEntity : BaseEntity
    {
    }
}
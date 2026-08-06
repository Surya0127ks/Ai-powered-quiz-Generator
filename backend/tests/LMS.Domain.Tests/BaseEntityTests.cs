using LMS.Domain.Common;

namespace LMS.Domain.Tests;

/// <summary>
/// Unit tests for the BaseEntity class.
/// </summary>
public class BaseEntityTests
{
    [Fact]
    public void Constructor_ShouldGenerateNewGuidId()
    {
        // Arrange & Act
        var entity = new TestEntity();

        // Assert
        entity.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void ClearDomainEvents_ShouldRemoveAllEvents()
    {
        // Arrange
        var entity = new TestEntity();

        // Act
        entity.ClearDomainEvents();

        // Assert
        entity.DomainEvents.Should().BeEmpty();
    }

    /// <summary>
    /// Test entity for testing BaseEntity.
    /// </summary>
    private sealed class TestEntity : BaseEntity
    {
    }
}
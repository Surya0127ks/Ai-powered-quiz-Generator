using LMS.Application.Common.Models;

namespace LMS.Application.Tests;

/// <summary>
/// Unit tests for the Result and Result generic classes.
/// </summary>
public class ResultTests
{
    [Fact]
    public void Success_ShouldReturnIsSuccessTrue()
    {
        // Arrange & Act
        var result = Result.Success();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void Failure_ShouldReturnIsSuccessFalseWithErrors()
    {
        // Arrange
        var errors = new[] { "Error 1", "Error 2" };

        // Act
        var result = Result.Failure(errors);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().BeEquivalentTo(errors);
    }

    [Fact]
    public void SuccessWithValue_ShouldContainValue()
    {
        // Arrange & Act
        var result = Result.Success(42);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(42);
    }
}
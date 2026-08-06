namespace LMS.Application.Common.Interfaces;

/// <summary>
/// Provides information about the currently authenticated user.
/// Abstracted to decouple the Application layer from authentication concerns.
/// </summary>
public interface ICurrentUserService
{
    /// <summary>
    /// Gets the unique identifier of the current user, or null if unauthenticated.
    /// </summary>
    Guid? UserId { get; }

    /// <summary>
    /// Gets the email address of the current user, or null if unauthenticated.
    /// </summary>
    string? Email { get; }

    /// <summary>
    /// Gets a value indicating whether the current user is authenticated.
    /// </summary>
    bool IsAuthenticated { get; }

    /// <summary>
    /// Gets the roles assigned to the current user.
    /// </summary>
    IReadOnlyList<string> Roles { get; }
}
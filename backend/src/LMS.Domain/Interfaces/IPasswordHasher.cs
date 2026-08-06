namespace LMS.Domain.Interfaces;

/// <summary>
/// Service contract for hashing and verifying user passwords securely.
/// </summary>
public interface IPasswordHasher
{
    /// <summary>
    /// Hashes a raw password string.
    /// </summary>
    string HashPassword(string password);

    /// <summary>
    /// Verifies a raw password string against a stored hash.
    /// </summary>
    bool VerifyPassword(string password, string passwordHash);
}

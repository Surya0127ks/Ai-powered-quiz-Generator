using LMS.Domain.Entities;

namespace LMS.Domain.Interfaces;

/// <summary>
/// Service contract for generating access tokens and refresh tokens.
/// </summary>
public interface IJwtTokenGenerator
{
    /// <summary>
    /// Generates a signed JWT access token containing tenant, user, and role claims.
    /// </summary>
    string GenerateAccessToken(User user, string tenantIdentifier);

    /// <summary>
    /// Generates a cryptographically secure random refresh token.
    /// </summary>
    string GenerateRefreshToken();
}

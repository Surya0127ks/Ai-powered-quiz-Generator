using LMS.Domain.Enums;

namespace LMS.Application.Features.Auth.DTOs;

public record UserDto(
    Guid Id,
    Guid TenantId,
    string Email,
    string FirstName,
    string LastName,
    UserRole Role,
    bool IsActive,
    DateTime CreatedAtUtc
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAtUtc,
    UserDto User
);

public record LoginRequestDto(
    string Email,
    string Password,
    string? TenantIdentifier
);

public record RegisterRequestDto(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string TenantName,
    string TenantIdentifier,
    UserRole Role = UserRole.Student
);

public record RefreshTokenRequestDto(
    string AccessToken,
    string RefreshToken
);

using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Auth.DTOs;
using LMS.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Auth.Commands.Login;

public record LoginCommand(
    string Email,
    string Password,
    string? TenantIdentifier
) : IRequest<Result<AuthResponseDto>>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email address is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<Result<AuthResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.ToLowerInvariant();
        var normalizedTenant = request.TenantIdentifier?.ToLowerInvariant();

        // Email-only sign-in is supported. If an email is shared across tenants,
        // resolve it by password instead of silently selecting an arbitrary account.
        var query = _context.Users.Include(u => u.Tenant).AsQueryable();

        if (!string.IsNullOrWhiteSpace(normalizedTenant))
        {
            query = query.Where(u => u.Tenant.Identifier == normalizedTenant);
        }

        var candidates = await query
            .Where(u => u.Email == normalizedEmail)
            .ToListAsync(cancellationToken);

        var matchingUsers = candidates
            .Where(u => _passwordHasher.VerifyPassword(request.Password, u.PasswordHash))
            .ToList();

        if (matchingUsers.Count != 1)
        {
            return Result.Failure<AuthResponseDto>("Invalid email or password.");
        }

        var user = matchingUsers[0];

        if (!user.IsActive)
        {
            return Result.Failure<AuthResponseDto>("Account is disabled. Please contact system administrator.");
        }

        // Issue fresh tokens
        var accessToken = _tokenGenerator.GenerateAccessToken(user, user.Tenant.Identifier);
        var refreshToken = _tokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        await _context.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto(
            user.Id,
            user.TenantId,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.IsActive,
            user.CreatedAt.UtcDateTime
        );

        var response = new AuthResponseDto(
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddHours(1),
            userDto
        );

        return Result.Success(response);
    }
}

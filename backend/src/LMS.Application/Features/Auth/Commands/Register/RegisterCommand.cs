using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Auth.DTOs;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using LMS.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Auth.Commands.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string TenantName,
    string TenantIdentifier,
    UserRole Role = UserRole.Student
) : IRequest<Result<AuthResponseDto>>;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email address is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters long.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.");

        RuleFor(x => x.TenantName)
            .NotEmpty().WithMessage("Tenant organization name is required.");

        RuleFor(x => x.TenantIdentifier)
            .NotEmpty().WithMessage("Tenant identifier is required.")
            .Matches("^[a-z0-9-]+$").WithMessage("Tenant identifier must contain only lowercase letters, numbers, and hyphens.");
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public RegisterCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<Result<AuthResponseDto>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var normalizedIdentifier = request.TenantIdentifier.ToLowerInvariant();
        var normalizedEmail = request.Email.ToLowerInvariant();

        // 1. Check or resolve Tenant
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Identifier == normalizedIdentifier, cancellationToken);

        if (tenant == null)
        {
            // Create new tenant if it doesn't exist
            tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = request.TenantName,
                Identifier = normalizedIdentifier,
                IsActive = true
            };
            tenant.MarkAsCreated(null);
            _context.Tenants.Add(tenant);
        }

        // 2. Check if user email already exists globally
        var existingUser = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (existingUser != null)
        {
            return Result.Failure<AuthResponseDto>("User with this email already exists.");
        }

        // 3. Create user
        var passwordHash = _passwordHasher.HashPassword(request.Password);
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = normalizedEmail,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PasswordHash = passwordHash,
            Role = request.Role,
            IsActive = true
        };
        user.MarkAsCreated(null);

        // 4. Issue tokens
        var accessToken = _tokenGenerator.GenerateAccessToken(user, tenant.Identifier);
        var refreshToken = _tokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        _context.Users.Add(user);
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

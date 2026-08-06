using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Sections.DTOs;
using LMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Sections.Commands.CreateSection;

public record CreateSectionCommand(
    Guid CourseId,
    string Title,
    string? Description
) : IRequest<Result<SectionDto>>;

public class CreateSectionCommandValidator : AbstractValidator<CreateSectionCommand>
{
    public CreateSectionCommandValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
    }
}

public class CreateSectionCommandHandler : IRequestHandler<CreateSectionCommand, Result<SectionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public CreateSectionCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<SectionDto>> Handle(CreateSectionCommand request, CancellationToken cancellationToken)
    {
        if (_tenantContext.TenantId == null)
        {
            return Result.Failure<SectionDto>("Tenant context is required.");
        }

        var tenantId = _tenantContext.TenantId.Value;

        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == request.CourseId && !c.IsDeleted, cancellationToken);

        if (course == null)
        {
            return Result.Failure<SectionDto>("Course not found.");
        }

        // Calculate next order index
        var maxOrder = await _context.Sections
            .Where(s => s.CourseId == request.CourseId && !s.IsDeleted)
            .MaxAsync(s => (int?)s.OrderIndex, cancellationToken) ?? 0;

        var section = new Section
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            CourseId = request.CourseId,
            Title = request.Title,
            Description = request.Description,
            OrderIndex = maxOrder + 1,
            IsDeleted = false
        };

        section.MarkAsCreated(_currentUserService.UserId);
        _context.Sections.Add(section);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new SectionDto(
            section.Id,
            section.CourseId,
            section.Title,
            section.Description,
            section.OrderIndex,
            section.CreatedAt.UtcDateTime,
            new List<LessonDto>()
        );

        return Result.Success(dto);
    }
}

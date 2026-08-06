using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Sections.DTOs;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Lessons.Commands.CreateLesson;

public record CreateLessonCommand(
    Guid SectionId,
    string Title,
    LessonType Type,
    string? Content,
    int? DurationMinutes,
    bool IsFreePreview,
    List<CreateLessonResourceDto>? Resources
) : IRequest<Result<LessonDto>>;

public class CreateLessonCommandValidator : AbstractValidator<CreateLessonCommand>
{
    public CreateLessonCommandValidator()
    {
        RuleFor(x => x.SectionId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
    }
}

public class CreateLessonCommandHandler : IRequestHandler<CreateLessonCommand, Result<LessonDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public CreateLessonCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<LessonDto>> Handle(CreateLessonCommand request, CancellationToken cancellationToken)
    {
        if (_tenantContext.TenantId == null)
        {
            return Result.Failure<LessonDto>("Tenant context is required.");
        }

        var section = await _context.Sections
            .FirstOrDefaultAsync(s => s.Id == request.SectionId && !s.IsDeleted, cancellationToken);

        if (section == null)
        {
            return Result.Failure<LessonDto>("Section not found.");
        }

        var tenantId = _tenantContext.TenantId.Value;
        var maxOrder = await _context.Lessons
            .Where(l => l.SectionId == request.SectionId && !l.IsDeleted)
            .MaxAsync(l => (int?)l.OrderIndex, cancellationToken) ?? 0;

        var slug = $"{request.Title.ToLowerInvariant().Replace(' ', '-')}-{Guid.NewGuid().ToString("N")[..6]}";

        var lesson = new Lesson
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SectionId = request.SectionId,
            Title = request.Title,
            Slug = slug,
            Type = request.Type,
            Content = request.Content,
            DurationMinutes = request.DurationMinutes,
            OrderIndex = maxOrder + 1,
            IsFreePreview = request.IsFreePreview,
            IsDeleted = false
        };

        lesson.MarkAsCreated(_currentUserService.UserId);

        if (request.Resources != null && request.Resources.Count > 0)
        {
            foreach (var res in request.Resources)
            {
                lesson.Resources.Add(new LessonResource
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    Title = res.Title,
                    FileUrl = res.FileUrl,
                    FileType = res.FileType,
                    FileSizeByte = res.FileSizeByte
                });
            }
        }

        _context.Lessons.Add(lesson);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new LessonDto(
            lesson.Id,
            lesson.SectionId,
            lesson.Title,
            lesson.Slug,
            lesson.Type,
            lesson.Content,
            lesson.DurationMinutes,
            lesson.OrderIndex,
            lesson.IsFreePreview,
            lesson.CreatedAt.UtcDateTime,
            lesson.Resources.Select(r => new LessonResourceDto(r.Id, r.LessonId, r.Title, r.FileUrl, r.FileType, r.FileSizeByte)).ToList()
        );

        return Result.Success(dto);
    }
}

using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Sections.DTOs;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Lessons.Commands.UpdateLesson;

public record UpdateLessonCommand(
    Guid Id,
    string Title,
    LessonType Type,
    string? Content,
    int? DurationMinutes,
    bool IsFreePreview
) : IRequest<Result<LessonDto>>;

public class UpdateLessonCommandValidator : AbstractValidator<UpdateLessonCommand>
{
    public UpdateLessonCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
    }
}

public class UpdateLessonCommandHandler : IRequestHandler<UpdateLessonCommand, Result<LessonDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateLessonCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<LessonDto>> Handle(UpdateLessonCommand request, CancellationToken cancellationToken)
    {
        var lesson = await _context.Lessons
            .Include(l => l.Resources)
            .FirstOrDefaultAsync(l => l.Id == request.Id && !l.IsDeleted, cancellationToken);

        if (lesson == null)
        {
            return Result.Failure<LessonDto>("Lesson not found.");
        }

        lesson.Title = request.Title;
        lesson.Type = request.Type;
        lesson.Content = request.Content;
        lesson.DurationMinutes = request.DurationMinutes;
        lesson.IsFreePreview = request.IsFreePreview;

        lesson.MarkAsModified(_currentUserService.UserId);
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

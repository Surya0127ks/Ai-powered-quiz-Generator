using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Progress.Commands.ToggleLessonCompletion;

public record ToggleLessonCompletionCommand(
    Guid LessonId,
    bool IsCompleted
) : IRequest<Result<bool>>;

public class ToggleLessonCompletionCommandValidator : AbstractValidator<ToggleLessonCompletionCommand>
{
    public ToggleLessonCompletionCommandValidator()
    {
        RuleFor(x => x.LessonId).NotEmpty();
    }
}

public class ToggleLessonCompletionCommandHandler : IRequestHandler<ToggleLessonCompletionCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public ToggleLessonCompletionCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<bool>> Handle(ToggleLessonCompletionCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<bool>("Authentication required.");
        }

        var userId = _currentUserService.UserId.Value;

        var lesson = await _context.Lessons
            .Include(l => l.Section)
            .FirstOrDefaultAsync(l => l.Id == request.LessonId && !l.IsDeleted, cancellationToken);

        if (lesson == null)
        {
            return Result.Failure<bool>("Lesson not found.");
        }

        var tenantId = _tenantContext.TenantId ?? lesson.TenantId;

        var completion = await _context.LessonCompletions
            .FirstOrDefaultAsync(c => c.UserId == userId && c.LessonId == request.LessonId, cancellationToken);

        if (completion == null)
        {
            completion = new LessonCompletion
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = userId,
                LessonId = request.LessonId,
                IsCompleted = request.IsCompleted,
                CompletedAtUtc = DateTimeOffset.UtcNow
            };
            completion.MarkAsCreated(userId);
            _context.LessonCompletions.Add(completion);
        }
        else
        {
            completion.IsCompleted = request.IsCompleted;
            completion.CompletedAtUtc = DateTimeOffset.UtcNow;
            completion.MarkAsModified(userId);
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Check if all lessons in the course are completed
        var courseId = lesson.Section.CourseId;
        var totalCourseLessons = await _context.Lessons
            .Where(l => l.Section.CourseId == courseId && !l.IsDeleted)
            .CountAsync(cancellationToken);

        var videoCompleted = await _context.UserVideoProgresses
            .Where(p => p.UserId == userId && p.Lesson.Section.CourseId == courseId && p.IsCompleted)
            .Select(p => p.LessonId)
            .ToListAsync(cancellationToken);

        var manualCompleted = await _context.LessonCompletions
            .Where(c => c.UserId == userId && c.Lesson.Section.CourseId == courseId && c.IsCompleted)
            .Select(c => c.LessonId)
            .ToListAsync(cancellationToken);

        var distinctCompletedCount = videoCompleted.Union(manualCompleted).Distinct().Count();

        if (totalCourseLessons > 0 && distinctCompletedCount >= totalCourseLessons)
        {
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId && !e.IsDeleted, cancellationToken);

            if (enrollment != null && enrollment.Status != EnrollmentStatus.Completed)
            {
                enrollment.Status = EnrollmentStatus.Completed;
                enrollment.CompletedAtUtc = DateTimeOffset.UtcNow;
                enrollment.MarkAsModified(userId);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return Result.Success(request.IsCompleted);
    }
}

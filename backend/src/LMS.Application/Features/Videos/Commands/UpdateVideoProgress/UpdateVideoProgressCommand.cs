using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Videos.DTOs;
using LMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Videos.Commands.UpdateVideoProgress;

public record UpdateVideoProgressCommand(
    Guid LessonId,
    int PositionSeconds,
    int TotalDurationSeconds
) : IRequest<Result<UserVideoProgressDto>>;

public class UpdateVideoProgressCommandValidator : AbstractValidator<UpdateVideoProgressCommand>
{
    public UpdateVideoProgressCommandValidator()
    {
        RuleFor(x => x.LessonId).NotEmpty();
        RuleFor(x => x.PositionSeconds).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TotalDurationSeconds).GreaterThan(0);
    }
}

public class UpdateVideoProgressCommandHandler : IRequestHandler<UpdateVideoProgressCommand, Result<UserVideoProgressDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public UpdateVideoProgressCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UserVideoProgressDto>> Handle(UpdateVideoProgressCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<UserVideoProgressDto>("User is not authenticated.");
        }

        var userId = _currentUserService.UserId.Value;

        var lesson = await _context.Lessons
            .FirstOrDefaultAsync(l => l.Id == request.LessonId && !l.IsDeleted, cancellationToken);

        if (lesson == null)
        {
            return Result.Failure<UserVideoProgressDto>("Lesson not found.");
        }

        var tenantId = _tenantContext.TenantId ?? lesson.TenantId;

        var prog = await _context.UserVideoProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.LessonId == request.LessonId, cancellationToken);

        var isCompleted = request.PositionSeconds >= (request.TotalDurationSeconds * 0.90);

        if (prog == null)
        {
            prog = new UserVideoProgress
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = userId,
                LessonId = request.LessonId,
                LastWatchedPositionSeconds = request.PositionSeconds,
                TotalDurationSeconds = request.TotalDurationSeconds,
                IsCompleted = isCompleted,
                LastWatchedAt = DateTimeOffset.UtcNow
            };
            prog.MarkAsCreated(userId);
            _context.UserVideoProgresses.Add(prog);
        }
        else
        {
            prog.LastWatchedPositionSeconds = Math.Max(prog.LastWatchedPositionSeconds, request.PositionSeconds);
            prog.TotalDurationSeconds = request.TotalDurationSeconds;
            prog.IsCompleted = prog.IsCompleted || isCompleted;
            prog.LastWatchedAt = DateTimeOffset.UtcNow;
            prog.MarkAsModified(userId);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var percentage = Math.Min(100.0, Math.Round((double)prog.LastWatchedPositionSeconds / prog.TotalDurationSeconds * 100, 2));

        var dto = new UserVideoProgressDto(
            prog.LessonId,
            prog.LastWatchedPositionSeconds,
            prog.TotalDurationSeconds,
            prog.IsCompleted,
            percentage,
            prog.LastWatchedAt.UtcDateTime
        );

        return Result.Success(dto);
    }
}

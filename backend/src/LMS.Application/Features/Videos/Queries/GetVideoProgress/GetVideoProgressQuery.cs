using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Videos.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Videos.Queries.GetVideoProgress;

public record GetVideoProgressQuery(Guid LessonId) : IRequest<Result<UserVideoProgressDto>>;

public class GetVideoProgressQueryHandler : IRequestHandler<GetVideoProgressQuery, Result<UserVideoProgressDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetVideoProgressQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UserVideoProgressDto>> Handle(GetVideoProgressQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<UserVideoProgressDto>("User is not authenticated.");
        }

        var userId = _currentUserService.UserId.Value;

        var prog = await _context.UserVideoProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.LessonId == request.LessonId, cancellationToken);

        if (prog == null)
        {
            return Result.Success(new UserVideoProgressDto(
                request.LessonId,
                0,
                0,
                false,
                0.0,
                DateTime.UtcNow
            ));
        }

        var percentage = prog.TotalDurationSeconds > 0
            ? Math.Min(100.0, Math.Round((double)prog.LastWatchedPositionSeconds / prog.TotalDurationSeconds * 100, 2))
            : 0.0;

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

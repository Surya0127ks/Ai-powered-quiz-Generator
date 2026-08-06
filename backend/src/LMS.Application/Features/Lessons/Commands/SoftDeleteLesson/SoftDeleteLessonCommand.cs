using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Lessons.Commands.SoftDeleteLesson;

public record SoftDeleteLessonCommand(Guid Id) : IRequest<Result>;

public class SoftDeleteLessonCommandHandler : IRequestHandler<SoftDeleteLessonCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SoftDeleteLessonCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(SoftDeleteLessonCommand request, CancellationToken cancellationToken)
    {
        var lesson = await _context.Lessons
            .FirstOrDefaultAsync(l => l.Id == request.Id && !l.IsDeleted, cancellationToken);

        if (lesson == null)
        {
            return Result.Failure("Lesson not found.");
        }

        lesson.IsDeleted = true;
        lesson.DeletedAt = DateTimeOffset.UtcNow;
        lesson.DeletedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

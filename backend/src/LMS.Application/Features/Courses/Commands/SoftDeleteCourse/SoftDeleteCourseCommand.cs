using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Courses.Commands.SoftDeleteCourse;

public record SoftDeleteCourseCommand(Guid Id) : IRequest<Result>;

public class SoftDeleteCourseCommandHandler : IRequestHandler<SoftDeleteCourseCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SoftDeleteCourseCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(SoftDeleteCourseCommand request, CancellationToken cancellationToken)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken);

        if (course == null)
        {
            return Result.Failure("Course not found.");
        }

        course.IsDeleted = true;
        course.DeletedAt = DateTimeOffset.UtcNow;
        course.DeletedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}

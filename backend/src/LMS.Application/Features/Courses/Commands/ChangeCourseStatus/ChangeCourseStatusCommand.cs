using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Courses.Commands.ChangeCourseStatus;

public record ChangeCourseStatusCommand(
    Guid Id,
    CourseStatus Status
) : IRequest<Result>;

public class ChangeCourseStatusCommandHandler : IRequestHandler<ChangeCourseStatusCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ChangeCourseStatusCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(ChangeCourseStatusCommand request, CancellationToken cancellationToken)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken);

        if (course == null)
        {
            return Result.Failure("Course not found.");
        }

        course.Status = request.Status;
        course.MarkAsModified(_currentUserService.UserId);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}

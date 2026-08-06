using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Enrollments.Commands.UnenrollCourse;

public record UnenrollCourseCommand(Guid CourseId) : IRequest<Result>;

public class UnenrollCourseCommandHandler : IRequestHandler<UnenrollCourseCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UnenrollCourseCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(UnenrollCourseCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure("Authentication required.");
        }

        var userId = _currentUserService.UserId.Value;

        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == request.CourseId && !e.IsDeleted, cancellationToken);

        if (enrollment == null)
        {
            return Result.Failure("Enrollment record not found.");
        }

        enrollment.Status = EnrollmentStatus.Cancelled;
        enrollment.MarkAsModified(userId);

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

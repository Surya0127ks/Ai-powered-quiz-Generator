using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Enrollments.DTOs;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Enrollments.Queries.CheckCourseAccess;

public record CheckCourseAccessQuery(Guid CourseId) : IRequest<Result<CourseAccessDto>>;

public class CheckCourseAccessQueryHandler : IRequestHandler<CheckCourseAccessQuery, Result<CourseAccessDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CheckCourseAccessQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<CourseAccessDto>> Handle(CheckCourseAccessQuery request, CancellationToken cancellationToken)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == request.CourseId && !c.IsDeleted, cancellationToken);

        if (course == null)
        {
            return Result.Failure<CourseAccessDto>("Course not found.");
        }

        var userId = _currentUserService.UserId;

        if (userId == null)
        {
            return Result.Success(new CourseAccessDto(
                course.Id,
                false,
                course.IsFree,
                null,
                course.IsFree
            ));
        }

        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.UserId == userId.Value && e.CourseId == request.CourseId && !e.IsDeleted, cancellationToken);

        var isEnrolled = enrollment != null && (enrollment.Status == EnrollmentStatus.Active || enrollment.Status == EnrollmentStatus.Completed);
        var canAccess = course.IsFree || isEnrolled;

        var dto = new CourseAccessDto(
            course.Id,
            isEnrolled,
            course.IsFree,
            enrollment?.Status,
            canAccess
        );

        return Result.Success(dto);
    }
}

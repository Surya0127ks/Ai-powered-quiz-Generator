using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Enrollments.DTOs;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Enrollments.Queries.GetUserEnrollments;

public record GetUserEnrollmentsQuery : IRequest<Result<List<EnrollmentDto>>>;

public class GetUserEnrollmentsQueryHandler : IRequestHandler<GetUserEnrollmentsQuery, Result<List<EnrollmentDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUserEnrollmentsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<EnrollmentDto>>> Handle(GetUserEnrollmentsQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<List<EnrollmentDto>>("Authentication required.");
        }

        var userId = _currentUserService.UserId.Value;

        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
            .Where(e => e.UserId == userId && !e.IsDeleted && e.Status != EnrollmentStatus.Cancelled)
            .OrderByDescending(e => e.EnrolledAtUtc)
            .ToListAsync(cancellationToken);

        var resultList = new List<EnrollmentDto>();

        foreach (var e in enrollments)
        {
            var totalLessons = await _context.Lessons
                .Where(l => l.Section.CourseId == e.CourseId && !l.IsDeleted)
                .CountAsync(cancellationToken);

            var completedLessons = await _context.UserVideoProgresses
                .Where(p => p.UserId == userId && p.Lesson.Section.CourseId == e.CourseId && p.IsCompleted)
                .CountAsync(cancellationToken);

            var percentage = totalLessons > 0
                ? Math.Min(100.0, Math.Round((double)completedLessons / totalLessons * 100, 2))
                : 0.0;

            resultList.Add(new EnrollmentDto(
                e.Id,
                e.UserId,
                e.CourseId,
                e.Course.Title,
                e.Course.Slug,
                e.Course.ThumbnailUrl,
                e.EnrolledAtUtc.UtcDateTime,
                e.Status,
                e.CompletedAtUtc?.UtcDateTime,
                percentage,
                completedLessons,
                totalLessons
            ));
        }

        return Result.Success(resultList);
    }
}

using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Instructor.DTOs;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Instructor.Queries.GetInstructorDashboardSummary;

public record GetInstructorDashboardSummaryQuery : IRequest<Result<InstructorDashboardSummaryDto>>;

public class GetInstructorDashboardSummaryQueryHandler : IRequestHandler<GetInstructorDashboardSummaryQuery, Result<InstructorDashboardSummaryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetInstructorDashboardSummaryQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<InstructorDashboardSummaryDto>> Handle(GetInstructorDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<InstructorDashboardSummaryDto>("Authentication required.");
        }

        var instructorId = _currentUserService.UserId.Value;

        // 1. Get all courses created by instructor
        var courses = await _context.Courses
            .Include(c => c.Category)
            .Where(c => c.InstructorId == instructorId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        var courseIds = courses.Select(c => c.Id).ToList();

        // 2. Get enrollments across instructor courses
        var enrollments = await _context.Enrollments
            .Where(e => courseIds.Contains(e.CourseId) && !e.IsDeleted)
            .ToListAsync(cancellationToken);

        var totalCourses = courses.Count;
        var publishedCoursesCount = courses.Count(c => c.Status == CourseStatus.Published);
        var draftCoursesCount = courses.Count(c => c.Status == CourseStatus.Draft);

        var totalEnrolledStudents = enrollments.Select(e => e.UserId).Distinct().Count();
        var totalCompletedEnrollments = enrollments.Count(e => e.Status == EnrollmentStatus.Completed);

        // Revenue calculation (Price * Enrolled Students placeholder)
        decimal totalEarnings = 0;
        foreach (var c in courses)
        {
            var studentCount = enrollments.Count(e => e.CourseId == c.Id);
            totalEarnings += (c.Price * studentCount);
        }

        double avgCompletionRate = enrollments.Count > 0
            ? Math.Round(((double)totalCompletedEnrollments / enrollments.Count) * 100, 1)
            : 0;

        // 3. Build performance items
        var recentCoursesList = new List<InstructorCoursePerformanceDto>();

        foreach (var c in courses.Take(10))
        {
            var courseEnrollments = enrollments.Where(e => e.CourseId == c.Id).ToList();
            var countEnrolled = courseEnrollments.Count;
            var countCompleted = courseEnrollments.Count(e => e.Status == EnrollmentStatus.Completed);
            var rate = countEnrolled > 0 ? Math.Round(((double)countCompleted / countEnrolled) * 100, 1) : 0;

            recentCoursesList.Add(new InstructorCoursePerformanceDto(
                c.Id,
                c.Title,
                c.Category?.Name ?? "General",
                c.Level,
                c.Status,
                c.Price,
                countEnrolled,
                countCompleted,
                rate,
                c.CreatedAt.UtcDateTime
            ));
        }

        var summary = new InstructorDashboardSummaryDto(
            totalCourses,
            publishedCoursesCount,
            draftCoursesCount,
            totalEnrolledStudents,
            totalCompletedEnrollments,
            totalEarnings,
            avgCompletionRate,
            recentCoursesList
        );

        return Result.Success(summary);
    }
}

using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Progress.DTOs;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Progress.Queries.GetStudentProgressSummary;

public record GetStudentProgressSummaryQuery : IRequest<Result<StudentProgressSummaryDto>>;

public class GetStudentProgressSummaryQueryHandler : IRequestHandler<GetStudentProgressSummaryQuery, Result<StudentProgressSummaryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetStudentProgressSummaryQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<StudentProgressSummaryDto>> Handle(GetStudentProgressSummaryQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<StudentProgressSummaryDto>("Authentication required.");
        }

        var userId = _currentUserService.UserId.Value;

        var activeEnrollments = await _context.Enrollments
            .Include(e => e.Course)
            .Where(e => e.UserId == userId && !e.IsDeleted && e.Status != EnrollmentStatus.Cancelled)
            .ToListAsync(cancellationToken);

        var totalEnrolled = activeEnrollments.Count;
        var totalCompletedCourses = activeEnrollments.Count(e => e.Status == EnrollmentStatus.Completed);

        // Fetch completed video lessons
        var videoCompletions = await _context.UserVideoProgresses
            .Include(p => p.Lesson)
                .ThenInclude(l => l.Section)
                    .ThenInclude(s => s.Course)
            .Where(p => p.UserId == userId && p.IsCompleted)
            .ToListAsync(cancellationToken);

        // Fetch manual lesson completions
        var manualCompletions = await _context.LessonCompletions
            .Include(c => c.Lesson)
                .ThenInclude(l => l.Section)
                    .ThenInclude(s => s.Course)
            .Where(c => c.UserId == userId && c.IsCompleted)
            .ToListAsync(cancellationToken);

        var totalWatchSeconds = await _context.UserVideoProgresses
            .Where(p => p.UserId == userId)
            .SumAsync(p => (long)p.LastWatchedPositionSeconds, cancellationToken);

        var totalWatchMinutes = Math.Round((double)totalWatchSeconds / 60.0, 1);

        // Combine completed lesson IDs
        var completedLessonIds = videoCompletions.Select(v => v.LessonId)
            .Union(manualCompletions.Select(m => m.LessonId))
            .Distinct()
            .ToList();

        var totalLessonsCompleted = completedLessonIds.Count;

        var courseOverviews = new List<CourseProgressOverviewDto>();
        double sumPercentages = 0;

        foreach (var e in activeEnrollments)
        {
            var totalLessons = await _context.Lessons
                .Where(l => l.Section.CourseId == e.CourseId && !l.IsDeleted)
                .CountAsync(cancellationToken);

            var completedLessons = await _context.Lessons
                .Where(l => l.Section.CourseId == e.CourseId && completedLessonIds.Contains(l.Id))
                .CountAsync(cancellationToken);

            var percent = totalLessons > 0 ? Math.Min(100.0, Math.Round((double)completedLessons / totalLessons * 100, 2)) : 0.0;
            sumPercentages += percent;

            courseOverviews.Add(new CourseProgressOverviewDto(
                e.CourseId,
                e.Course.Title,
                e.Course.ThumbnailUrl,
                totalLessons,
                completedLessons,
                percent,
                e.EnrolledAtUtc.UtcDateTime
            ));
        }

        var overallPercentage = totalEnrolled > 0 ? Math.Round(sumPercentages / totalEnrolled, 2) : 0.0;

        var recentList = videoCompletions
            .Select(v => new RecentCompletionItemDto(
                v.LessonId,
                v.Lesson.Title,
                v.Lesson.Section.Course.Title,
                v.Lesson.Type,
                v.LastWatchedAt.UtcDateTime
            ))
            .OrderByDescending(r => r.CompletedAtUtc)
            .Take(5)
            .ToList();

        var summary = new StudentProgressSummaryDto(
            totalEnrolled,
            totalCompletedCourses,
            totalLessonsCompleted,
            totalWatchMinutes,
            overallPercentage,
            recentList,
            courseOverviews
        );

        return Result.Success(summary);
    }
}

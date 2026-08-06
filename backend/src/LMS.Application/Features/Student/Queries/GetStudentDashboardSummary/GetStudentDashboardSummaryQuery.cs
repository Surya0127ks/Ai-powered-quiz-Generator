using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Student.DTOs;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Student.Queries.GetStudentDashboardSummary;

public record GetStudentDashboardSummaryQuery(Guid UserId) : IRequest<Result<StudentDashboardSummaryDto>>;

public class GetStudentDashboardSummaryQueryHandler : IRequestHandler<GetStudentDashboardSummaryQuery, Result<StudentDashboardSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetStudentDashboardSummaryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<StudentDashboardSummaryDto>> Handle(GetStudentDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        // 1. Fetch user enrollments
        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
            .Where(e => e.UserId == request.UserId && !e.Course.IsDeleted)
            .ToListAsync(cancellationToken);

        int totalEnrolled = enrollments.Count;
        int completedCourses = enrollments.Count(e => e.Status == EnrollmentStatus.Completed || e.CompletedAtUtc != null);

        // Fetch sections and lessons for enrolled courses
        var enrolledCourseIds = enrollments.Select(e => e.CourseId).ToList();
        var sections = await _context.Sections
            .Include(s => s.Lessons)
            .Where(s => enrolledCourseIds.Contains(s.CourseId) && !s.IsDeleted)
            .ToListAsync(cancellationToken);

        // 2. Fetch completions for watch time and lessons count
        var completions = await _context.LessonCompletions
            .Include(lc => lc.Lesson)
            .Where(lc => lc.UserId == request.UserId && lc.IsCompleted)
            .ToListAsync(cancellationToken);

        int totalLessonsCompleted = completions.Count;
        int totalWatchTimeMinutes = completions.Sum(lc => lc.Lesson?.DurationMinutes ?? 0);

        // 3. Build enrollment progress items
        var activeProgressItems = new List<StudentEnrollmentProgressItemDto>();
        foreach (var e in enrollments)
        {
            var courseSections = sections.Where(s => s.CourseId == e.CourseId).ToList();
            var allLessons = courseSections.SelectMany(s => s.Lessons).ToList();
            int totalLessons = allLessons.Count;
            int completedInCourse = completions.Count(c => allLessons.Any(l => l.Id == c.LessonId));
            double progressPercentage = totalLessons > 0 ? Math.Round((double)completedInCourse / totalLessons * 100, 1) : 0;
            
            var lastCompletion = completions
                .Where(c => allLessons.Any(l => l.Id == c.LessonId))
                .OrderByDescending(c => c.CompletedAtUtc)
                .FirstOrDefault();

            activeProgressItems.Add(new StudentEnrollmentProgressItemDto(
                e.CourseId,
                e.Course.Title,
                e.Course.ThumbnailUrl,
                progressPercentage,
                completedInCourse,
                totalLessons,
                lastCompletion?.LessonId,
                lastCompletion?.Lesson?.Title
            ));
        }

        // 4. Fetch certificates
        var certificates = await _context.Certificates
            .Include(c => c.Course)
            .Where(c => c.UserId == request.UserId && !c.IsDeleted)
            .OrderByDescending(c => c.IssuedAtUtc)
            .ToListAsync(cancellationToken);

        var certificateDtos = certificates.Select(c => new StudentCertificateSummaryDto(
            c.Id,
            c.CourseId ?? Guid.Empty,
            c.Course?.Title ?? c.Quiz?.Title ?? "Course Certificate",
            c.CertificateNumber,
            c.IssuedAtUtc.UtcDateTime
        )).ToList();

        // 5. Fetch recent quiz attempts
        var quizAttempts = await _context.QuizAttempts
            .Include(qa => qa.Quiz)
            .Where(qa => qa.UserId == request.UserId)
            .OrderByDescending(qa => qa.SubmittedAtUtc ?? qa.StartedAtUtc)
            .Take(5)
            .ToListAsync(cancellationToken);

        var quizAttemptDtos = quizAttempts.Select(qa => new StudentQuizAttemptSummaryDto(
            qa.QuizId,
            qa.Quiz?.Title ?? "Quiz Assessment",
            qa.ScorePercentage,
            qa.IsPassed,
            (qa.SubmittedAtUtc ?? qa.StartedAtUtc).UtcDateTime
        )).ToList();

        // 6. Fetch recent assignment submissions
        var assignmentSubmissions = await _context.AssignmentSubmissions
            .Include(asub => asub.Assignment)
            .Where(asub => asub.StudentId == request.UserId)
            .OrderByDescending(asub => asub.SubmittedAtUtc)
            .Take(5)
            .ToListAsync(cancellationToken);

        var assignmentDtos = assignmentSubmissions.Select(asub => new StudentAssignmentSubmissionSummaryDto(
            asub.AssignmentId,
            asub.Assignment?.Title ?? "Coursework Assignment",
            asub.Status.ToString(),
            asub.EarnedMarks,
            asub.SubmittedAtUtc.UtcDateTime
        )).ToList();

        var summaryDto = new StudentDashboardSummaryDto(
            totalEnrolled,
            completedCourses,
            certificateDtos.Count,
            totalLessonsCompleted,
            totalWatchTimeMinutes,
            activeProgressItems,
            quizAttemptDtos,
            assignmentDtos,
            certificateDtos
        );

        return Result.Success(summaryDto);
    }
}

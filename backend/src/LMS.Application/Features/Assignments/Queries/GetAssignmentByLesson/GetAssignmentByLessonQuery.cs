using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Assignments.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Assignments.Queries.GetAssignmentByLesson;

public record GetAssignmentByLessonQuery(Guid LessonId) : IRequest<Result<AssignmentDto>>;

public class GetAssignmentByLessonQueryHandler : IRequestHandler<GetAssignmentByLessonQuery, Result<AssignmentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAssignmentByLessonQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AssignmentDto>> Handle(GetAssignmentByLessonQuery request, CancellationToken cancellationToken)
    {
        var assignment = await _context.Assignments
            .FirstOrDefaultAsync(a => a.LessonId == request.LessonId && !a.IsDeleted, cancellationToken);

        if (assignment == null)
        {
            return Result.Failure<AssignmentDto>("No assignment found for this lesson.");
        }

        AssignmentSubmissionDto? mySubmissionDto = null;
        if (_currentUserService.UserId.HasValue)
        {
            var userId = _currentUserService.UserId.Value;
            var sub = await _context.AssignmentSubmissions
                .Include(s => s.Student)
                .FirstOrDefaultAsync(s => s.AssignmentId == assignment.Id && s.StudentId == userId, cancellationToken);

            if (sub != null)
            {
                mySubmissionDto = new AssignmentSubmissionDto(
                    sub.Id,
                    sub.AssignmentId,
                    sub.StudentId,
                    $"{sub.Student.FirstName} {sub.Student.LastName}",
                    sub.Content,
                    sub.AttachmentUrl,
                    sub.SubmittedAtUtc.UtcDateTime,
                    sub.Status,
                    sub.EarnedMarks,
                    sub.Feedback,
                    sub.GradedAtUtc?.UtcDateTime
                );
            }
        }

        var dto = new AssignmentDto(
            assignment.Id,
            assignment.LessonId,
            assignment.Title,
            assignment.Instructions,
            assignment.MaxMarks,
            assignment.DueDateUtc?.UtcDateTime,
            assignment.AttachmentUrl,
            mySubmissionDto
        );

        return Result.Success(dto);
    }
}

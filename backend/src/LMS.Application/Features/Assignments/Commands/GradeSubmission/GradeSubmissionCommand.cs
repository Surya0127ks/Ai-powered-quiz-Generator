using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Assignments.DTOs;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Assignments.Commands.GradeSubmission;

public record GradeSubmissionCommand(
    Guid SubmissionId,
    int EarnedMarks,
    string? Feedback,
    SubmissionStatus Status
) : IRequest<Result<AssignmentSubmissionDto>>;

public class GradeSubmissionCommandValidator : AbstractValidator<GradeSubmissionCommand>
{
    public GradeSubmissionCommandValidator()
    {
        RuleFor(x => x.SubmissionId).NotEmpty();
        RuleFor(x => x.EarnedMarks).GreaterThanOrEqualTo(0);
    }
}

public class GradeSubmissionCommandHandler : IRequestHandler<GradeSubmissionCommand, Result<AssignmentSubmissionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public GradeSubmissionCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AssignmentSubmissionDto>> Handle(GradeSubmissionCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<AssignmentSubmissionDto>("Authentication required.");
        }

        var instructorId = _currentUserService.UserId.Value;

        var sub = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .FirstOrDefaultAsync(s => s.Id == request.SubmissionId, cancellationToken);

        if (sub == null)
        {
            return Result.Failure<AssignmentSubmissionDto>("Submission not found.");
        }

        sub.EarnedMarks = request.EarnedMarks;
        sub.Feedback = request.Feedback;
        sub.Status = request.Status;
        sub.GradedBy = instructorId;
        sub.GradedAtUtc = DateTimeOffset.UtcNow;
        sub.MarkAsModified(instructorId);

        await _context.SaveChangesAsync(cancellationToken);

        // Auto-mark lesson completed if graded & passing score (e.g. >= 50% max marks)
        if (request.Status == SubmissionStatus.Graded && sub.EarnedMarks >= (sub.Assignment.MaxMarks * 0.50))
        {
            var tenantId = _tenantContext.TenantId ?? sub.TenantId;
            var completion = await _context.LessonCompletions
                .FirstOrDefaultAsync(c => c.UserId == sub.StudentId && c.LessonId == sub.Assignment.LessonId, cancellationToken);

            if (completion == null)
            {
                completion = new LessonCompletion
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    UserId = sub.StudentId,
                    LessonId = sub.Assignment.LessonId,
                    IsCompleted = true,
                    CompletedAtUtc = DateTimeOffset.UtcNow
                };
                completion.MarkAsCreated(instructorId);
                _context.LessonCompletions.Add(completion);
            }
            else
            {
                completion.IsCompleted = true;
                completion.CompletedAtUtc = DateTimeOffset.UtcNow;
                completion.MarkAsModified(instructorId);
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        var dto = new AssignmentSubmissionDto(
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

        return Result.Success(dto);
    }
}

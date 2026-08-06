using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Assignments.DTOs;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Assignments.Commands.SubmitAssignment;

public record SubmitAssignmentCommand(
    Guid AssignmentId,
    string? Content,
    string? AttachmentUrl
) : IRequest<Result<AssignmentSubmissionDto>>;

public class SubmitAssignmentCommandValidator : AbstractValidator<SubmitAssignmentCommand>
{
    public SubmitAssignmentCommandValidator()
    {
        RuleFor(x => x.AssignmentId).NotEmpty();
    }
}

public class SubmitAssignmentCommandHandler : IRequestHandler<SubmitAssignmentCommand, Result<AssignmentSubmissionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public SubmitAssignmentCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AssignmentSubmissionDto>> Handle(SubmitAssignmentCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<AssignmentSubmissionDto>("Authentication required.");
        }

        var userId = _currentUserService.UserId.Value;

        var assignment = await _context.Assignments
            .FirstOrDefaultAsync(a => a.Id == request.AssignmentId && !a.IsDeleted, cancellationToken);

        if (assignment == null)
        {
            return Result.Failure<AssignmentSubmissionDto>("Assignment not found.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        var tenantId = _tenantContext.TenantId ?? assignment.TenantId;

        var sub = await _context.AssignmentSubmissions
            .FirstOrDefaultAsync(s => s.AssignmentId == request.AssignmentId && s.StudentId == userId, cancellationToken);

        if (sub == null)
        {
            sub = new AssignmentSubmission
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                AssignmentId = request.AssignmentId,
                StudentId = userId,
                Content = request.Content,
                AttachmentUrl = request.AttachmentUrl ?? "cloudinary_assignment_submission_placeholder.pdf",
                SubmittedAtUtc = DateTimeOffset.UtcNow,
                Status = SubmissionStatus.Pending
            };
            sub.MarkAsCreated(userId);
            _context.AssignmentSubmissions.Add(sub);
        }
        else
        {
            sub.Content = request.Content;
            sub.AttachmentUrl = request.AttachmentUrl ?? sub.AttachmentUrl;
            sub.SubmittedAtUtc = DateTimeOffset.UtcNow;
            sub.Status = SubmissionStatus.Pending;
            sub.MarkAsModified(userId);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var dto = new AssignmentSubmissionDto(
            sub.Id,
            sub.AssignmentId,
            sub.StudentId,
            user != null ? $"{user.FirstName} {user.LastName}" : "Student",
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

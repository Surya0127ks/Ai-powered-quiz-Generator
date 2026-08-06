using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Assignments.DTOs;
using LMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Assignments.Commands.CreateAssignment;

public record CreateAssignmentCommand(
    Guid LessonId,
    string Title,
    string Instructions,
    int MaxMarks,
    DateTime? DueDateUtc,
    string? AttachmentUrl
) : IRequest<Result<AssignmentDto>>;

public class CreateAssignmentCommandValidator : AbstractValidator<CreateAssignmentCommand>
{
    public CreateAssignmentCommandValidator()
    {
        RuleFor(x => x.LessonId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Instructions).NotEmpty();
        RuleFor(x => x.MaxMarks).GreaterThan(0);
    }
}

public class CreateAssignmentCommandHandler : IRequestHandler<CreateAssignmentCommand, Result<AssignmentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public CreateAssignmentCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AssignmentDto>> Handle(CreateAssignmentCommand request, CancellationToken cancellationToken)
    {
        var lesson = await _context.Lessons
            .FirstOrDefaultAsync(l => l.Id == request.LessonId && !l.IsDeleted, cancellationToken);

        if (lesson == null)
        {
            return Result.Failure<AssignmentDto>("Lesson not found.");
        }

        var tenantId = _tenantContext.TenantId ?? lesson.TenantId;

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            LessonId = request.LessonId,
            Title = request.Title,
            Instructions = request.Instructions,
            MaxMarks = request.MaxMarks,
            DueDateUtc = request.DueDateUtc.HasValue ? new DateTimeOffset(request.DueDateUtc.Value, TimeSpan.Zero) : null,
            AttachmentUrl = request.AttachmentUrl,
            IsDeleted = false
        };

        assignment.MarkAsCreated(_currentUserService.UserId);
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new AssignmentDto(
            assignment.Id,
            assignment.LessonId,
            assignment.Title,
            assignment.Instructions,
            assignment.MaxMarks,
            assignment.DueDateUtc?.UtcDateTime,
            assignment.AttachmentUrl,
            null
        );

        return Result.Success(dto);
    }
}

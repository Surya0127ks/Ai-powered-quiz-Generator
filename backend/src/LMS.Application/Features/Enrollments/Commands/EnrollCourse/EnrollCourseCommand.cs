using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Enrollments.DTOs;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Enrollments.Commands.EnrollCourse;

public record EnrollCourseCommand(Guid CourseId) : IRequest<Result<EnrollmentDto>>;

public class EnrollCourseCommandValidator : AbstractValidator<EnrollCourseCommand>
{
    public EnrollCourseCommandValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
    }
}

public class EnrollCourseCommandHandler : IRequestHandler<EnrollCourseCommand, Result<EnrollmentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public EnrollCourseCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<EnrollmentDto>> Handle(EnrollCourseCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<EnrollmentDto>("Authentication required to enroll.");
        }

        var userId = _currentUserService.UserId.Value;

        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == request.CourseId && !c.IsDeleted, cancellationToken);

        if (course == null)
        {
            return Result.Failure<EnrollmentDto>("Course not found.");
        }

        if (course.Status != CourseStatus.Published)
        {
            return Result.Failure<EnrollmentDto>("Cannot enroll in a course that is not published.");
        }

        var tenantId = _tenantContext.TenantId ?? course.TenantId;

        // Check existing active enrollment
        var existing = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == request.CourseId && !e.IsDeleted, cancellationToken);

        if (existing != null)
        {
            if (existing.Status == EnrollmentStatus.Active || existing.Status == EnrollmentStatus.Completed)
            {
                return Result.Failure<EnrollmentDto>("Already enrolled in this course.");
            }

            // Reactivate dropped enrollment
            existing.Status = EnrollmentStatus.Active;
            existing.EnrolledAtUtc = DateTimeOffset.UtcNow;
            existing.MarkAsModified(userId);
        }
        else
        {
            existing = new Enrollment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = userId,
                CourseId = request.CourseId,
                Status = EnrollmentStatus.Active,
                EnrolledAtUtc = DateTimeOffset.UtcNow,
                IsDeleted = false
            };
            existing.MarkAsCreated(userId);
            _context.Enrollments.Add(existing);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var dto = new EnrollmentDto(
            existing.Id,
            existing.UserId,
            course.Id,
            course.Title,
            course.Slug,
            course.ThumbnailUrl,
            existing.EnrolledAtUtc.UtcDateTime,
            existing.Status,
            existing.CompletedAtUtc?.UtcDateTime,
            0.0,
            0,
            0
        );

        return Result.Success(dto);
    }
}

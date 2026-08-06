using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Courses.DTOs;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Courses.Commands.CreateCourse;

public record CreateCourseCommand(
    Guid CategoryId,
    string Title,
    string ShortDescription,
    string Description,
    CourseLevel Level,
    string Language,
    string? ThumbnailUrl,
    decimal Price,
    decimal? DiscountPrice,
    bool IsFree,
    string Currency,
    List<string>? Tags
) : IRequest<Result<CourseDto>>;

public class CreateCourseCommandValidator : AbstractValidator<CreateCourseCommand>
{
    public CreateCourseCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Course title is required.")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

        RuleFor(x => x.ShortDescription)
            .NotEmpty().WithMessage("Short description is required.")
            .MaximumLength(500).WithMessage("Short description cannot exceed 500 characters.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Course description is required.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category selection is required.");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Price must be greater than or equal to 0.");
    }
}

public class CreateCourseCommandHandler : IRequestHandler<CreateCourseCommand, Result<CourseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public CreateCourseCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<CourseDto>> Handle(CreateCourseCommand request, CancellationToken cancellationToken)
    {
        if (_tenantContext.TenantId == null)
        {
            return Result.Failure<CourseDto>("Tenant context is required to create a course.");
        }

        if (_currentUserService.UserId == null)
        {
            return Result.Failure<CourseDto>("Instructor context is required.");
        }

        var tenantId = _tenantContext.TenantId.Value;
        var instructorId = _currentUserService.UserId.Value;

        // 1. Verify Category
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);

        if (category == null)
        {
            return Result.Failure<CourseDto>("Selected category does not exist under current tenant.");
        }

        // 2. Generate slug
        var baseSlug = request.Title.ToLowerInvariant().Replace(' ', '-');
        var slug = $"{baseSlug}-{Guid.NewGuid().ToString("N")[..6]}";

        // 3. Create course entity
        var course = new Course
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            InstructorId = instructorId,
            CategoryId = request.CategoryId,
            Title = request.Title,
            Slug = slug,
            ShortDescription = request.ShortDescription,
            Description = request.Description,
            Level = request.Level,
            Language = string.IsNullOrWhiteSpace(request.Language) ? "English" : request.Language,
            ThumbnailUrl = request.ThumbnailUrl ?? "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            Price = request.IsFree ? 0 : request.Price,
            DiscountPrice = request.IsFree ? null : request.DiscountPrice,
            IsFree = request.IsFree,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "USD" : request.Currency,
            Status = CourseStatus.Draft,
            IsDeleted = false
        };

        course.MarkAsCreated(instructorId);

        // 4. Attach Tags
        if (request.Tags != null && request.Tags.Count > 0)
        {
            foreach (var tagName in request.Tags)
            {
                var tagSlug = tagName.Trim().ToLowerInvariant().Replace(' ', '-');
                var existingTag = await _context.CourseTags
                    .FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Slug == tagSlug, cancellationToken);

                if (existingTag == null)
                {
                    existingTag = new CourseTag
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Name = tagName.Trim(),
                        Slug = tagSlug
                    };
                    _context.CourseTags.Add(existingTag);
                }

                course.Tags.Add(existingTag);
            }
        }

        _context.Courses.Add(course);
        await _context.SaveChangesAsync(cancellationToken);

        var instructor = await _context.Users.FirstOrDefaultAsync(u => u.Id == instructorId, cancellationToken);
        var instructorName = instructor != null ? $"{instructor.FirstName} {instructor.LastName}" : "Instructor";

        var dto = new CourseDto(
            course.Id,
            course.TenantId,
            course.InstructorId,
            instructorName,
            course.CategoryId,
            category.Name,
            course.Title,
            course.Slug,
            course.ShortDescription,
            course.Description,
            course.Level,
            course.Language,
            course.ThumbnailUrl,
            course.Price,
            course.DiscountPrice,
            course.IsFree,
            course.Currency,
            course.Status,
            course.CreatedAt.UtcDateTime,
            course.Tags.Select(t => new CourseTagDto(t.Id, t.Name, t.Slug)).ToList()
        );

        return Result.Success(dto);
    }
}

using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Courses.DTOs;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Courses.Commands.UpdateCourse;

public record UpdateCourseCommand(
    Guid Id,
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

public class UpdateCourseCommandValidator : AbstractValidator<UpdateCourseCommand>
{
    public UpdateCourseCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ShortDescription).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}

public class UpdateCourseCommandHandler : IRequestHandler<UpdateCourseCommand, Result<CourseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateCourseCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<CourseDto>> Handle(UpdateCourseCommand request, CancellationToken cancellationToken)
    {
        var course = await _context.Courses
            .Include(c => c.Category)
            .Include(c => c.Instructor)
            .Include(c => c.Tags)
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken);

        if (course == null)
        {
            return Result.Failure<CourseDto>("Course not found.");
        }

        // Verify Category
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && !c.IsDeleted, cancellationToken);

        if (category == null)
        {
            return Result.Failure<CourseDto>("Category not found.");
        }

        course.CategoryId = request.CategoryId;
        course.Title = request.Title;
        course.ShortDescription = request.ShortDescription;
        course.Description = request.Description;
        course.Level = request.Level;
        course.Language = request.Language;
        if (!string.IsNullOrWhiteSpace(request.ThumbnailUrl))
        {
            course.ThumbnailUrl = request.ThumbnailUrl;
        }
        course.Price = request.IsFree ? 0 : request.Price;
        course.DiscountPrice = request.IsFree ? null : request.DiscountPrice;
        course.IsFree = request.IsFree;
        course.Currency = request.Currency;

        course.MarkAsModified(_currentUserService.UserId);

        await _context.SaveChangesAsync(cancellationToken);

        var dto = new CourseDto(
            course.Id,
            course.TenantId,
            course.InstructorId,
            $"{course.Instructor.FirstName} {course.Instructor.LastName}",
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

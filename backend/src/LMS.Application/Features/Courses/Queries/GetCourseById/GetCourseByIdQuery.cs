using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Courses.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Courses.Queries.GetCourseById;

public record GetCourseByIdQuery(Guid Id) : IRequest<Result<CourseDto>>;

public class GetCourseByIdQueryHandler : IRequestHandler<GetCourseByIdQuery, Result<CourseDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCourseByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CourseDto>> Handle(GetCourseByIdQuery request, CancellationToken cancellationToken)
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

        var dto = new CourseDto(
            course.Id,
            course.TenantId,
            course.InstructorId,
            $"{course.Instructor.FirstName} {course.Instructor.LastName}",
            course.CategoryId,
            course.Category.Name,
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

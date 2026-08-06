using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Courses.DTOs;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Courses.Queries.GetCourses;

public record GetCoursesQuery(
    CourseFilterParamsDto Filter
) : IRequest<Result<PagedResult<CourseSummaryDto>>>;

public class GetCoursesQueryHandler : IRequestHandler<GetCoursesQuery, Result<PagedResult<CourseSummaryDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;

    public GetCoursesQueryHandler(IApplicationDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async Task<Result<PagedResult<CourseSummaryDto>>> Handle(GetCoursesQuery request, CancellationToken cancellationToken)
    {
        var f = request.Filter;
        var tenantId = _tenantContext.TenantId;

        var query = _context.Courses
            .Include(c => c.Category)
            .Where(c => !c.IsDeleted)
            .AsQueryable();

        // 1. Tenant Isolation
        if (tenantId != null)
        {
            query = query.Where(c => c.TenantId == tenantId);
        }

        // 2. Searching using EF.Functions.Like
        if (!string.IsNullOrWhiteSpace(f.SearchTerm))
        {
            var pattern = $"%{f.SearchTerm.Trim()}%";
            query = query.Where(c => EF.Functions.Like(c.Title, pattern) ||
                                     EF.Functions.Like(c.ShortDescription, pattern) ||
                                     EF.Functions.Like(c.Description, pattern));
        }

        // 3. Filtering
        if (f.CategoryId.HasValue)
        {
            query = query.Where(c => c.CategoryId == f.CategoryId.Value);
        }

        if (f.Level.HasValue)
        {
            query = query.Where(c => c.Level == f.Level.Value);
        }

        if (!string.IsNullOrWhiteSpace(f.Language))
        {
            query = query.Where(c => c.Language == f.Language);
        }

        if (f.Status.HasValue)
        {
            query = query.Where(c => c.Status == f.Status.Value);
        }

        if (f.IsFree.HasValue)
        {
            query = query.Where(c => c.IsFree == f.IsFree.Value);
        }

        if (f.MinPrice.HasValue)
        {
            query = query.Where(c => c.Price >= f.MinPrice.Value);
        }

        if (f.MaxPrice.HasValue)
        {
            query = query.Where(c => c.Price <= f.MaxPrice.Value);
        }

        // 4. Sorting
        query = (f.SortBy?.ToLowerInvariant()) switch
        {
            "title" => f.SortDescending ? query.OrderByDescending(c => c.Title) : query.OrderBy(c => c.Title),
            "price" => f.SortDescending ? query.OrderByDescending(c => c.Price) : query.OrderBy(c => c.Price),
            "status" => f.SortDescending ? query.OrderByDescending(c => c.Status) : query.OrderBy(c => c.Status),
            _ => f.SortDescending ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt)
        };

        // 5. Pagination using PagedResult<T>
        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, f.PageNumber);
        var pageSize = Math.Clamp(f.PageSize, 1, 100);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CourseSummaryDto(
                c.Id,
                c.CategoryId,
                c.Category.Name,
                c.Title,
                c.Slug,
                c.ShortDescription,
                c.Level,
                c.Language,
                c.ThumbnailUrl,
                c.Price,
                c.DiscountPrice,
                c.IsFree,
                c.Currency,
                c.Status,
                c.CreatedAt.UtcDateTime
            ))
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<CourseSummaryDto>(items, pageNumber, pageSize, totalCount);
        return Result.Success(pagedResult);
    }
}

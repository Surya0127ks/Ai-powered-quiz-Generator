using LMS.Domain.Enums;

namespace LMS.Application.Features.Courses.DTOs;

public record CategoryDto(
    Guid Id,
    Guid TenantId,
    string Name,
    string Slug,
    string? Description,
    Guid? ParentCategoryId,
    bool IsActive
);

public record CourseTagDto(
    Guid Id,
    string Name,
    string Slug
);

public record CourseDto(
    Guid Id,
    Guid TenantId,
    Guid InstructorId,
    string InstructorName,
    Guid CategoryId,
    string CategoryName,
    string Title,
    string Slug,
    string ShortDescription,
    string Description,
    CourseLevel Level,
    string Language,
    string? ThumbnailUrl,
    decimal Price,
    decimal? DiscountPrice,
    bool IsFree,
    string Currency,
    CourseStatus Status,
    DateTime CreatedAtUtc,
    List<CourseTagDto> Tags
);

public record CourseSummaryDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Title,
    string Slug,
    string ShortDescription,
    CourseLevel Level,
    string Language,
    string? ThumbnailUrl,
    decimal Price,
    decimal? DiscountPrice,
    bool IsFree,
    string Currency,
    CourseStatus Status,
    DateTime CreatedAtUtc
);

public record CreateCategoryDto(
    string Name,
    string? Description,
    Guid? ParentCategoryId
);

public record CreateCourseDto(
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
);

public record UpdateCourseDto(
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
);

public record CourseFilterParamsDto(
    string? SearchTerm,
    Guid? CategoryId,
    CourseLevel? Level,
    string? Language,
    CourseStatus? Status,
    decimal? MinPrice,
    decimal? MaxPrice,
    bool? IsFree,
    string? SortBy = "CreatedAt",
    bool SortDescending = true,
    int PageNumber = 1,
    int PageSize = 10
);

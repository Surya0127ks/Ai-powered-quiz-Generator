using LMS.Domain.Enums;

namespace LMS.Application.Features.Sections.DTOs;

public record LessonResourceDto(
    Guid Id,
    Guid LessonId,
    string Title,
    string FileUrl,
    string FileType,
    long? FileSizeByte
);

public record LessonDto(
    Guid Id,
    Guid SectionId,
    string Title,
    string Slug,
    LessonType Type,
    string? Content,
    int? DurationMinutes,
    int OrderIndex,
    bool IsFreePreview,
    DateTime CreatedAtUtc,
    List<LessonResourceDto> Resources
);

public record SectionDto(
    Guid Id,
    Guid CourseId,
    string Title,
    string? Description,
    int OrderIndex,
    DateTime CreatedAtUtc,
    List<LessonDto> Lessons
);

public record CreateSectionDto(
    string Title,
    string? Description
);

public record UpdateSectionDto(
    string Title,
    string? Description
);

public record CreateLessonDto(
    string Title,
    LessonType Type,
    string? Content,
    int? DurationMinutes,
    bool IsFreePreview,
    List<CreateLessonResourceDto>? Resources
);

public record CreateLessonResourceDto(
    string Title,
    string FileUrl,
    string FileType,
    long? FileSizeByte
);

public record UpdateLessonDto(
    string Title,
    LessonType Type,
    string? Content,
    int? DurationMinutes,
    bool IsFreePreview,
    List<CreateLessonResourceDto>? Resources
);

public record ReorderItemsDto(
    List<OrderItem> Items
);

public record OrderItem(
    Guid Id,
    int OrderIndex
);

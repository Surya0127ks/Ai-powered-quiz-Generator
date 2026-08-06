using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Sections.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Sections.Queries.GetSectionsByCourse;

public record GetSectionsByCourseQuery(Guid CourseId) : IRequest<Result<List<SectionDto>>>;

public class GetSectionsByCourseQueryHandler : IRequestHandler<GetSectionsByCourseQuery, Result<List<SectionDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetSectionsByCourseQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<SectionDto>>> Handle(GetSectionsByCourseQuery request, CancellationToken cancellationToken)
    {
        var sections = await _context.Sections
            .Include(s => s.Lessons.Where(l => !l.IsDeleted))
                .ThenInclude(l => l.Resources)
            .Where(s => s.CourseId == request.CourseId && !s.IsDeleted)
            .OrderBy(s => s.OrderIndex)
            .Select(s => new SectionDto(
                s.Id,
                s.CourseId,
                s.Title,
                s.Description,
                s.OrderIndex,
                s.CreatedAt.UtcDateTime,
                s.Lessons
                    .Where(l => !l.IsDeleted)
                    .OrderBy(l => l.OrderIndex)
                    .Select(l => new LessonDto(
                        l.Id,
                        l.SectionId,
                        l.Title,
                        l.Slug,
                        l.Type,
                        l.Content,
                        l.DurationMinutes,
                        l.OrderIndex,
                        l.IsFreePreview,
                        l.CreatedAt.UtcDateTime,
                        l.Resources.Select(r => new LessonResourceDto(
                            r.Id,
                            r.LessonId,
                            r.Title,
                            r.FileUrl,
                            r.FileType,
                            r.FileSizeByte
                        )).ToList()
                    )).ToList()
            ))
            .ToListAsync(cancellationToken);

        return Result.Success(sections);
    }
}

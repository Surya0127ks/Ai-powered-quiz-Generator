using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Videos.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Videos.Queries.GetVideoMetadata;

public record GetVideoMetadataQuery(Guid LessonId) : IRequest<Result<VideoMetadataDto>>;

public class GetVideoMetadataQueryHandler : IRequestHandler<GetVideoMetadataQuery, Result<VideoMetadataDto>>
{
    private readonly IApplicationDbContext _context;

    public GetVideoMetadataQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<VideoMetadataDto>> Handle(GetVideoMetadataQuery request, CancellationToken cancellationToken)
    {
        var meta = await _context.VideoMetadatas
            .FirstOrDefaultAsync(v => v.LessonId == request.LessonId, cancellationToken);

        if (meta == null)
        {
            return Result.Failure<VideoMetadataDto>("Video metadata not found for this lesson.");
        }

        var dto = new VideoMetadataDto(
            meta.Id,
            meta.LessonId,
            meta.Provider,
            meta.PublicId,
            meta.VideoUrl,
            meta.PlaybackUrl,
            meta.DurationSeconds,
            meta.Resolution,
            meta.SizeBytes
        );

        return Result.Success(dto);
    }
}

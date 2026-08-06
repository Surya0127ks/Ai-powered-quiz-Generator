using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Videos.DTOs;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Videos.Commands.UpsertVideoMetadata;

public record UpsertVideoMetadataCommand(
    Guid LessonId,
    VideoProvider Provider,
    string? PublicId,
    string VideoUrl,
    string PlaybackUrl,
    int DurationSeconds,
    string? Resolution,
    long? SizeBytes
) : IRequest<Result<VideoMetadataDto>>;

public class UpsertVideoMetadataCommandValidator : AbstractValidator<UpsertVideoMetadataCommand>
{
    public UpsertVideoMetadataCommandValidator()
    {
        RuleFor(x => x.LessonId).NotEmpty();
        RuleFor(x => x.VideoUrl).NotEmpty();
        RuleFor(x => x.PlaybackUrl).NotEmpty();
        RuleFor(x => x.DurationSeconds).GreaterThanOrEqualTo(0);
    }
}

public class UpsertVideoMetadataCommandHandler : IRequestHandler<UpsertVideoMetadataCommand, Result<VideoMetadataDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public UpsertVideoMetadataCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<VideoMetadataDto>> Handle(UpsertVideoMetadataCommand request, CancellationToken cancellationToken)
    {
        var lesson = await _context.Lessons
            .FirstOrDefaultAsync(l => l.Id == request.LessonId && !l.IsDeleted, cancellationToken);

        if (lesson == null)
        {
            return Result.Failure<VideoMetadataDto>("Lesson not found.");
        }

        var tenantId = _tenantContext.TenantId ?? lesson.TenantId;

        var meta = await _context.VideoMetadatas
            .FirstOrDefaultAsync(v => v.LessonId == request.LessonId, cancellationToken);

        if (meta == null)
        {
            meta = new VideoMetadata
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                LessonId = request.LessonId,
                Provider = request.Provider,
                PublicId = request.PublicId ?? "cloudinary_placeholder_public_id",
                VideoUrl = request.VideoUrl,
                PlaybackUrl = request.PlaybackUrl,
                DurationSeconds = request.DurationSeconds,
                Resolution = request.Resolution ?? "1080p",
                SizeBytes = request.SizeBytes
            };
            meta.MarkAsCreated(_currentUserService.UserId);
            _context.VideoMetadatas.Add(meta);
        }
        else
        {
            meta.Provider = request.Provider;
            meta.PublicId = request.PublicId ?? meta.PublicId;
            meta.VideoUrl = request.VideoUrl;
            meta.PlaybackUrl = request.PlaybackUrl;
            meta.DurationSeconds = request.DurationSeconds;
            meta.Resolution = request.Resolution ?? meta.Resolution;
            meta.SizeBytes = request.SizeBytes ?? meta.SizeBytes;
            meta.MarkAsModified(_currentUserService.UserId);
        }

        await _context.SaveChangesAsync(cancellationToken);

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

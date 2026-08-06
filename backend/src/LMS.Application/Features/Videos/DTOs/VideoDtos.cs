using LMS.Domain.Enums;

namespace LMS.Application.Features.Videos.DTOs;

public record VideoMetadataDto(
    Guid Id,
    Guid LessonId,
    VideoProvider Provider,
    string? PublicId,
    string VideoUrl,
    string PlaybackUrl,
    int DurationSeconds,
    string? Resolution,
    long? SizeBytes
);

public record UpsertVideoMetadataDto(
    VideoProvider Provider,
    string? PublicId,
    string VideoUrl,
    string PlaybackUrl,
    int DurationSeconds,
    string? Resolution,
    long? SizeBytes
);

public record UserVideoProgressDto(
    Guid LessonId,
    int LastWatchedPositionSeconds,
    int TotalDurationSeconds,
    bool IsCompleted,
    double ProgressPercentage,
    DateTime LastWatchedAtUtc
);

public record UpdateVideoProgressDto(
    int PositionSeconds,
    int TotalDurationSeconds
);

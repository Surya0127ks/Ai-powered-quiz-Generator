using LMS.Domain.Common;
using LMS.Domain.Enums;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents video stream metadata associated with a lesson.
/// </summary>
public class VideoMetadata : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid LessonId { get; set; }

    public VideoProvider Provider { get; set; } = VideoProvider.Cloudinary;
    public string? PublicId { get; set; } // Cloudinary Public ID or asset key placeholder
    public string VideoUrl { get; set; } = string.Empty;
    public string PlaybackUrl { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
    public string? Resolution { get; set; } = "1080p";
    public long? SizeBytes { get; set; }

    // Navigation property
    public Lesson Lesson { get; set; } = null!;
}

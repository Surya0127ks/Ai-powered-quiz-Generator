namespace LMS.Domain.Enums;

/// <summary>
/// Defines the video storage / streaming provider type.
/// </summary>
public enum VideoProvider
{
    /// <summary>
    /// Cloudinary media service provider.
    /// </summary>
    Cloudinary = 1,

    /// <summary>
    /// Direct HTTPS video file URL.
    /// </summary>
    DirectUrl = 2,

    /// <summary>
    /// HTTP Live Streaming (HLS) adaptive playlist.
    /// </summary>
    HLS = 3
}

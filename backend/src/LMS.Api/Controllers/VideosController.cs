using LMS.Application.Features.Videos.Commands.UpdateVideoProgress;
using LMS.Application.Features.Videos.Commands.UpsertVideoMetadata;
using LMS.Application.Features.Videos.DTOs;
using LMS.Application.Features.Videos.Queries.GetVideoMetadata;
using LMS.Application.Features.Videos.Queries.GetVideoProgress;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

public class VideosController : ApiControllerBase
{
    /// <summary>
    /// Gets video stream metadata for a lesson.
    /// </summary>
    [HttpGet("/api/v1/lessons/{lessonId:guid}/video")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VideoMetadataDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetVideoMetadata(Guid lessonId, CancellationToken cancellationToken)
    {
        var query = new GetVideoMetadataQuery(lessonId);
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Upserts video metadata for a lesson (Supports Cloudinary placeholders).
    /// </summary>
    [HttpPut("/api/v1/lessons/{lessonId:guid}/video")]
    [Authorize]
    [ProducesResponseType(typeof(VideoMetadataDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpsertVideoMetadata(Guid lessonId, [FromBody] UpsertVideoMetadataDto dto, CancellationToken cancellationToken)
    {
        var command = new UpsertVideoMetadataCommand(
            lessonId,
            dto.Provider,
            dto.PublicId,
            dto.VideoUrl,
            dto.PlaybackUrl,
            dto.DurationSeconds,
            dto.Resolution,
            dto.SizeBytes
        );

        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets current authenticated student's watching progress for a lesson.
    /// </summary>
    [HttpGet("/api/v1/lessons/{lessonId:guid}/progress")]
    [Authorize]
    [ProducesResponseType(typeof(UserVideoProgressDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVideoProgress(Guid lessonId, CancellationToken cancellationToken)
    {
        var query = new GetVideoProgressQuery(lessonId);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result.Value);
    }

    /// <summary>
    /// Updates student's video watching position and completion status in real-time.
    /// </summary>
    [HttpPost("/api/v1/lessons/{lessonId:guid}/progress")]
    [Authorize]
    [ProducesResponseType(typeof(UserVideoProgressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateVideoProgress(Guid lessonId, [FromBody] UpdateVideoProgressDto dto, CancellationToken cancellationToken)
    {
        var command = new UpdateVideoProgressCommand(lessonId, dto.PositionSeconds, dto.TotalDurationSeconds);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }
}

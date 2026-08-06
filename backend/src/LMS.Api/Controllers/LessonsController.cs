using LMS.Application.Features.Lessons.Commands.CreateLesson;
using LMS.Application.Features.Lessons.Commands.SoftDeleteLesson;
using LMS.Application.Features.Lessons.Commands.UpdateLesson;
using LMS.Application.Features.Sections.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

public class LessonsController : ApiControllerBase
{
    /// <summary>
    /// Creates a new lesson under a section.
    /// </summary>
    [HttpPost("/api/v1/sections/{sectionId:guid}/lessons")]
    [Authorize]
    [ProducesResponseType(typeof(LessonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLesson(Guid sectionId, [FromBody] CreateLessonDto dto, CancellationToken cancellationToken)
    {
        var command = new CreateLessonCommand(
            sectionId,
            dto.Title,
            dto.Type,
            dto.Content,
            dto.DurationMinutes,
            dto.IsFreePreview,
            dto.Resources
        );

        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Updates lesson details.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(LessonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateLesson(Guid id, [FromBody] UpdateLessonDto dto, CancellationToken cancellationToken)
    {
        var command = new UpdateLessonCommand(
            id,
            dto.Title,
            dto.Type,
            dto.Content,
            dto.DurationMinutes,
            dto.IsFreePreview
        );

        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Soft deletes a lesson.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SoftDeleteLesson(Guid id, CancellationToken cancellationToken)
    {
        var command = new SoftDeleteLessonCommand(id);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new { message = "Lesson soft deleted successfully." });
    }
}

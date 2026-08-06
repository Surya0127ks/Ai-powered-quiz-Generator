using LMS.Application.Features.Sections.Commands.CreateSection;
using LMS.Application.Features.Sections.Commands.SoftDeleteSection;
using LMS.Application.Features.Sections.DTOs;
using LMS.Application.Features.Sections.Queries.GetSectionsByCourse;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

public class SectionsController : ApiControllerBase
{
    /// <summary>
    /// Gets all active sections and lessons for a course.
    /// </summary>
    [HttpGet("/api/v1/courses/{courseId:guid}/sections")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<SectionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSectionsByCourse(Guid courseId, CancellationToken cancellationToken)
    {
        var query = new GetSectionsByCourseQuery(courseId);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new section under a course.
    /// </summary>
    [HttpPost("/api/v1/courses/{courseId:guid}/sections")]
    [Authorize]
    [ProducesResponseType(typeof(SectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateSection(Guid courseId, [FromBody] CreateSectionDto dto, CancellationToken cancellationToken)
    {
        var command = new CreateSectionCommand(courseId, dto.Title, dto.Description);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Soft deletes a section and its lessons.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SoftDeleteSection(Guid id, CancellationToken cancellationToken)
    {
        var command = new SoftDeleteSectionCommand(id);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new { message = "Section soft deleted successfully." });
    }
}

using LMS.Application.Features.Progress.Commands.ToggleLessonCompletion;
using LMS.Application.Features.Progress.DTOs;
using LMS.Application.Features.Progress.Queries.GetStudentProgressSummary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

public class StudentProgressController : ApiControllerBase
{
    /// <summary>
    /// Gets overall student progress summary dashboard metrics.
    /// </summary>
    [HttpGet("/api/v1/progress/summary")]
    [Authorize]
    [ProducesResponseType(typeof(StudentProgressSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProgressSummary(CancellationToken cancellationToken)
    {
        var query = new GetStudentProgressSummaryQuery();
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Toggles completion status for a specific lesson.
    /// </summary>
    [HttpPost("/api/v1/progress/lessons/{lessonId:guid}/toggle")]
    [Authorize]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ToggleLessonCompletion(Guid lessonId, [FromBody] bool isCompleted, CancellationToken cancellationToken)
    {
        var command = new ToggleLessonCompletionCommand(lessonId, isCompleted);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new { lessonId, isCompleted = result.Value });
    }
}

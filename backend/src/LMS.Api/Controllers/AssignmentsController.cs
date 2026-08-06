using LMS.Application.Features.Assignments.Commands.CreateAssignment;
using LMS.Application.Features.Assignments.Commands.GradeSubmission;
using LMS.Application.Features.Assignments.Commands.SubmitAssignment;
using LMS.Application.Features.Assignments.DTOs;
using LMS.Application.Features.Assignments.Queries.GetAssignmentByLesson;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

public class AssignmentsController : ApiControllerBase
{
    /// <summary>
    /// Gets assignment instructions and student submission for a lesson.
    /// </summary>
    [HttpGet("/api/v1/lessons/{lessonId:guid}/assignment")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AssignmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAssignmentByLesson(Guid lessonId, CancellationToken cancellationToken)
    {
        var query = new GetAssignmentByLessonQuery(lessonId);
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new coursework assignment under a lesson.
    /// </summary>
    [HttpPost("/api/v1/lessons/{lessonId:guid}/assignment")]
    [Authorize]
    [ProducesResponseType(typeof(AssignmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAssignment(Guid lessonId, [FromBody] CreateAssignmentDto dto, CancellationToken cancellationToken)
    {
        var command = new CreateAssignmentCommand(
            lessonId,
            dto.Title,
            dto.Instructions,
            dto.MaxMarks,
            dto.DueDateUtc,
            dto.AttachmentUrl
        );

        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Submits student assignment content and Cloudinary file URL placeholder.
    /// </summary>
    [HttpPost("/api/v1/assignments/{assignmentId:guid}/submit")]
    [Authorize]
    [ProducesResponseType(typeof(AssignmentSubmissionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitAssignment(Guid assignmentId, [FromBody] SubmitAssignmentDto dto, CancellationToken cancellationToken)
    {
        var command = new SubmitAssignmentCommand(assignmentId, dto.Content, dto.AttachmentUrl);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Grades student submission and provides feedback (Instructor feature).
    /// </summary>
    [HttpPost("/api/v1/assignments/submissions/{submissionId:guid}/grade")]
    [Authorize]
    [ProducesResponseType(typeof(AssignmentSubmissionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GradeSubmission(Guid submissionId, [FromBody] GradeSubmissionDto dto, CancellationToken cancellationToken)
    {
        var command = new GradeSubmissionCommand(submissionId, dto.EarnedMarks, dto.Feedback, dto.Status);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }
}

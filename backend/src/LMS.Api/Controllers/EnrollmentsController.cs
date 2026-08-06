using LMS.Application.Features.Enrollments.Commands.EnrollCourse;
using LMS.Application.Features.Enrollments.Commands.UnenrollCourse;
using LMS.Application.Features.Enrollments.DTOs;
using LMS.Application.Features.Enrollments.Queries.CheckCourseAccess;
using LMS.Application.Features.Enrollments.Queries.GetUserEnrollments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

public class EnrollmentsController : ApiControllerBase
{
    /// <summary>
    /// Enrolls the authenticated student in a course.
    /// </summary>
    [HttpPost("/api/v1/courses/{courseId:guid}/enroll")]
    [Authorize]
    [ProducesResponseType(typeof(EnrollmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Enroll(Guid courseId, CancellationToken cancellationToken)
    {
        var command = new EnrollCourseCommand(courseId);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Unenrolls/drops the authenticated student from a course.
    /// </summary>
    [HttpDelete("/api/v1/courses/{courseId:guid}/unenroll")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Unenroll(Guid courseId, CancellationToken cancellationToken)
    {
        var command = new UnenrollCourseCommand(courseId);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new { message = "Unenrolled successfully." });
    }

    /// <summary>
    /// Gets all enrolled courses for the authenticated student with progress statistics.
    /// </summary>
    [HttpGet("/api/v1/enrollments/my-courses")]
    [Authorize]
    [ProducesResponseType(typeof(List<EnrollmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyEnrollments(CancellationToken cancellationToken)
    {
        var query = new GetUserEnrollmentsQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result.Value);
    }

    /// <summary>
    /// Verifies if student has active access to a course.
    /// </summary>
    [HttpGet("/api/v1/courses/{courseId:guid}/access")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CourseAccessDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckCourseAccess(Guid courseId, CancellationToken cancellationToken)
    {
        var query = new CheckCourseAccessQuery(courseId);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result.Value);
    }
}

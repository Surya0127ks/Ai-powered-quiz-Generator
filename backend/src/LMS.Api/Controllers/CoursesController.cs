using LMS.Application.Common.Models;
using LMS.Application.Features.Courses.Commands.ChangeCourseStatus;
using LMS.Application.Features.Courses.Commands.CreateCourse;
using LMS.Application.Features.Courses.Commands.SoftDeleteCourse;
using LMS.Application.Features.Courses.Commands.UpdateCourse;
using LMS.Application.Features.Courses.DTOs;
using LMS.Application.Features.Courses.Queries.GetCourseById;
using LMS.Application.Features.Courses.Queries.GetCourses;
using LMS.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

public class CoursesController : ApiControllerBase
{
    /// <summary>
    /// Gets a paginated, searchable, and filtered catalog of courses.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<CourseSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCourses([FromQuery] CourseFilterParamsDto filter, CancellationToken cancellationToken)
    {
        var query = new GetCoursesQuery(filter);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result.Value);
    }

    /// <summary>
    /// Gets course details by unique identifier.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CourseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCourseById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetCourseByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new course.
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(CourseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto dto, CancellationToken cancellationToken)
    {
        var command = new CreateCourseCommand(
            dto.CategoryId,
            dto.Title,
            dto.ShortDescription,
            dto.Description,
            dto.Level,
            dto.Language,
            dto.ThumbnailUrl,
            dto.Price,
            dto.DiscountPrice,
            dto.IsFree,
            dto.Currency,
            dto.Tags
        );

        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Updates course details.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(CourseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseDto dto, CancellationToken cancellationToken)
    {
        var command = new UpdateCourseCommand(
            id,
            dto.CategoryId,
            dto.Title,
            dto.ShortDescription,
            dto.Description,
            dto.Level,
            dto.Language,
            dto.ThumbnailUrl,
            dto.Price,
            dto.DiscountPrice,
            dto.IsFree,
            dto.Currency,
            dto.Tags
        );

        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Updates the status of a course (Draft, Published, Archived).
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangeCourseStatus(Guid id, [FromBody] CourseStatus status, CancellationToken cancellationToken)
    {
        var command = new ChangeCourseStatusCommand(id, status);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new { message = "Course status updated successfully." });
    }

    /// <summary>
    /// Soft deletes a course.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SoftDeleteCourse(Guid id, CancellationToken cancellationToken)
    {
        var command = new SoftDeleteCourseCommand(id);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new { message = "Course soft deleted successfully." });
    }
}

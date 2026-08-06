using LMS.Application.Features.Instructor.DTOs;
using LMS.Application.Features.Instructor.Queries.GetInstructorDashboardSummary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

[Authorize]
public class InstructorDashboardController : ApiControllerBase
{
    /// <summary>
    /// Gets aggregated instructor performance analytics, courses list, and student enrollment metrics.
    /// </summary>
    [HttpGet("/api/v1/instructor/dashboard/summary")]
    [ProducesResponseType(typeof(InstructorDashboardSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDashboardSummary(CancellationToken cancellationToken)
    {
        var query = new GetInstructorDashboardSummaryQuery();
        var result = await Mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }
}

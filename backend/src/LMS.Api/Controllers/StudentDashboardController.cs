using LMS.Application.Common.Interfaces;
using LMS.Application.Features.Student.DTOs;
using LMS.Application.Features.Student.Queries.GetStudentDashboardSummary;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/v1/student/dashboard")]
[Authorize]
public class StudentDashboardController : ControllerBase
{
    private readonly ISender _mediator;
    private readonly ICurrentUserService _currentUserService;

    public StudentDashboardController(ISender mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<StudentDashboardSummaryDto>> GetSummary()
    {
        if (_currentUserService.UserId == null)
            return Unauthorized();

        var query = new GetStudentDashboardSummaryQuery(_currentUserService.UserId.Value);
        var result = await _mediator.Send(query);

        if (!result.IsSuccess)
            return BadRequest(new { result.Error });

        return Ok(result.Value);
    }
}

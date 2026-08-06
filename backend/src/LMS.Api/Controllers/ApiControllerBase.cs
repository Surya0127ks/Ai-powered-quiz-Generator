using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

/// <summary>
/// Base controller for all API controllers.
/// Provides common mediator dispatching and helper properties.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    private ISender? _mediator;

    protected ISender Mediator =>
        _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    /// <summary>
    /// Gets the IP address of the current client.
    /// </summary>
    protected string? ClientIpAddress =>
        HttpContext.Connection.RemoteIpAddress?.ToString();
}
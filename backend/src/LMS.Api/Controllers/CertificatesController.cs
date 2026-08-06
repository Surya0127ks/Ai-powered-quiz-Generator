using LMS.Application.Features.Certificates.Commands.GenerateCertificate;
using LMS.Application.Features.Certificates.DTOs;
using LMS.Application.Features.Certificates.Queries.GetUserCertificates;
using LMS.Application.Features.Certificates.Queries.VerifyCertificate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

public class CertificatesController : ApiControllerBase
{
    /// <summary>
    /// Generates or retrieves an official completion certificate for a completed course.
    /// </summary>
    [HttpPost("/api/v1/courses/{courseId:guid}/certificate/generate")]
    [Authorize]
    [ProducesResponseType(typeof(CertificateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateCertificate(Guid courseId, CancellationToken cancellationToken)
    {
        var command = new GenerateCertificateCommand(courseId);
        var result = await Mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets all completion certificates earned by the authenticated student.
    /// </summary>
    [HttpGet("/api/v1/certificates/my-certificates")]
    [Authorize]
    [ProducesResponseType(typeof(List<CertificateDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyCertificates(CancellationToken cancellationToken)
    {
        var query = new GetUserCertificatesQuery();
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result.Value);
    }

    /// <summary>
    /// Public verification endpoint to validate certificate authenticity by CertificateNumber code.
    /// </summary>
    [HttpGet("/api/v1/certificates/verify/{certificateNumber}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerifyCertificateResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> VerifyCertificate(string certificateNumber, CancellationToken cancellationToken)
    {
        var query = new VerifyCertificateQuery(certificateNumber);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result.Value);
    }
}

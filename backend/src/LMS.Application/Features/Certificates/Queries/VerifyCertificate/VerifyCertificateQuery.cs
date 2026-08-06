using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Certificates.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Certificates.Queries.VerifyCertificate;

public record VerifyCertificateQuery(string CertificateNumber) : IRequest<Result<VerifyCertificateResultDto>>;

public class VerifyCertificateQueryHandler : IRequestHandler<VerifyCertificateQuery, Result<VerifyCertificateResultDto>>
{
    private readonly IApplicationDbContext _context;

    public VerifyCertificateQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<VerifyCertificateResultDto>> Handle(VerifyCertificateQuery request, CancellationToken cancellationToken)
    {
        var cert = await _context.Certificates
            .Include(c => c.User)
            .Include(c => c.Course)
            .Include(c => c.Quiz)
            .FirstOrDefaultAsync(c => c.CertificateNumber == request.CertificateNumber && !c.IsDeleted, cancellationToken);

        if (cert == null)
        {
            return Result.Success(new VerifyCertificateResultDto(
                false,
                request.CertificateNumber,
                null,
                null,
                null,
                null,
                "Certificate invalid or not found in official LMS registry."
            ));
        }

        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == cert.TenantId, cancellationToken);

        var studentName = cert.User != null ? $"{cert.User.FirstName} {cert.User.LastName}" : cert.StudentName ?? "Unknown Student";
        var title = cert.Course != null ? cert.Course.Title : cert.Quiz?.Title ?? "Unknown Assessment";

        var result = new VerifyCertificateResultDto(
            true,
            cert.CertificateNumber,
            studentName,
            title,
            cert.IssuedAtUtc.UtcDateTime,
            tenant?.Name ?? "LMS Enterprise SaaS Academy",
            "Official Verified Certificate of Completion."
        );

        return Result.Success(result);
    }
}

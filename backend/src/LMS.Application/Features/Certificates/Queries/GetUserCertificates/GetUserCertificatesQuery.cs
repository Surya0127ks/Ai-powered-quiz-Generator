using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Certificates.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Certificates.Queries.GetUserCertificates;

public record GetUserCertificatesQuery : IRequest<Result<List<CertificateDto>>>;

public class GetUserCertificatesQueryHandler : IRequestHandler<GetUserCertificatesQuery, Result<List<CertificateDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUserCertificatesQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<CertificateDto>>> Handle(GetUserCertificatesQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<List<CertificateDto>>("Authentication required.");
        }

        var userId = _currentUserService.UserId.Value;

        var certs = await _context.Certificates
            .Include(c => c.Course)
            .Include(c => c.User)
            .Include(c => c.Quiz)
            .Where(c => c.UserId == userId && !c.IsDeleted)
            .OrderByDescending(c => c.IssuedAtUtc)
            .Select(c => new CertificateDto(
                c.Id,
                c.UserId,
                c.User != null ? $"{c.User.FirstName} {c.User.LastName}" : c.StudentName ?? "Unknown Student",
                c.CourseId,
                c.Course != null ? c.Course.Title : null,
                c.QuizId,
                c.Quiz != null ? c.Quiz.Title : null,
                c.CertificateNumber,
                c.IssuedAtUtc.UtcDateTime,
                c.PdfUrl,
                c.QrCodeUrl,
                $"/verify-certificate?code={c.CertificateNumber}"
            ))
            .ToListAsync(cancellationToken);

        return Result.Success(certs);
    }
}

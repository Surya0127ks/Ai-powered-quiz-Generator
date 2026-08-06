using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Certificates.DTOs;
using LMS.Domain.Entities;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Certificates.Commands.GenerateCertificate;

public record GenerateCertificateCommand(Guid CourseId) : IRequest<Result<CertificateDto>>;

public class GenerateCertificateCommandValidator : AbstractValidator<GenerateCertificateCommand>
{
    public GenerateCertificateCommandValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
    }
}

public class GenerateCertificateCommandHandler : IRequestHandler<GenerateCertificateCommand, Result<CertificateDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public GenerateCertificateCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<CertificateDto>> Handle(GenerateCertificateCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<CertificateDto>("Authentication required.");
        }

        var userId = _currentUserService.UserId.Value;

        var enrollment = await _context.Enrollments
            .Include(e => e.Course)
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == request.CourseId && !e.IsDeleted, cancellationToken);

        if (enrollment == null)
        {
            return Result.Failure<CertificateDto>("Student is not enrolled in this course.");
        }

        if (enrollment.Status != EnrollmentStatus.Completed)
        {
            return Result.Failure<CertificateDto>("Course must be 100% completed before issuing a certificate.");
        }

        var existingCert = await _context.Certificates
            .FirstOrDefaultAsync(c => c.UserId == userId && c.CourseId == request.CourseId && !c.IsDeleted, cancellationToken);

        if (existingCert == null)
        {
            var certNum = $"CERT-LMS-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
            var tenantId = _tenantContext.TenantId ?? enrollment.TenantId;

            existingCert = new Certificate
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = userId,
                CourseId = request.CourseId,
                CertificateNumber = certNum,
                IssuedAtUtc = DateTimeOffset.UtcNow,
                PdfUrl = $"https://api.lms-saas.com/certificates/{certNum}/export.pdf",
                QrCodeUrl = $"https://api.lms-saas.com/certificates/{certNum}/qr.png",
                IsDeleted = false
            };

            existingCert.MarkAsCreated(userId);
            _context.Certificates.Add(existingCert);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var studentName = $"{enrollment.User.FirstName} {enrollment.User.LastName}";
        var dto = new CertificateDto(
            existingCert.Id,
            existingCert.UserId,
            studentName,
            existingCert.CourseId,
            enrollment.Course.Title,
            existingCert.QuizId,
            existingCert.Quiz?.Title,
            existingCert.CertificateNumber,
            existingCert.IssuedAtUtc.UtcDateTime,
            existingCert.PdfUrl,
            existingCert.QrCodeUrl,
            $"/verify-certificate?code={existingCert.CertificateNumber}"
        );

        return Result.Success(dto);
    }
}

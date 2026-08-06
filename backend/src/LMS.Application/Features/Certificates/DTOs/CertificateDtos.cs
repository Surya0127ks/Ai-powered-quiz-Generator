namespace LMS.Application.Features.Certificates.DTOs;

public record CertificateDto(
    Guid Id,
    Guid? UserId,
    string StudentName,
    Guid? CourseId,
    string? CourseTitle,
    Guid? QuizId,
    string? QuizTitle,
    string CertificateNumber,
    DateTime IssuedAtUtc,
    string PdfUrl,
    string QrCodeUrl,
    string VerificationUrl
);

public record VerifyCertificateResultDto(
    bool IsValid,
    string? CertificateNumber,
    string? StudentName,
    string? CourseTitle,
    DateTime? IssuedAtUtc,
    string? OrganizationName,
    string? VerificationMessage
);

using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents an official course completion certificate issued to a student.
/// </summary>
public class Certificate : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    public Guid? CourseId { get; set; }
    public Guid? QuizId { get; set; }
    public Guid? QuizAttemptId { get; set; }

    public string? StudentName { get; set; }
    public string? RollNumber { get; set; }
    public double? ScorePercentage { get; set; }

    public string CertificateNumber { get; set; } = string.Empty; // Unique code e.g. "CERT-LMS-2026-A89B"
    public DateTimeOffset IssuedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string PdfUrl { get; set; } = string.Empty; // PDF Download placeholder URL
    public string QrCodeUrl { get; set; } = string.Empty; // QR Verification placeholder URL

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Navigation properties
    public User? User { get; set; }
    public Course? Course { get; set; }
    public Quiz? Quiz { get; set; }
    public QuizAttempt? QuizAttempt { get; set; }
}

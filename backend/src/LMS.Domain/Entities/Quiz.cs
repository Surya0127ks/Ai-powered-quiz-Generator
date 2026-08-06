using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a standalone or lesson-associated assessment quiz.
/// </summary>
public class Quiz : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid? LessonId { get; set; }
    public Guid? CreatedByUserId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; } = "General";
    public string? Difficulty { get; set; } = "Intermediate";
    public string? CoverImageUrl { get; set; }
    public bool IsPublished { get; set; } = true;
    public int PassingScorePercentage { get; set; } = 70;
    public int? TimeLimitMinutes { get; set; }
    public int? MaxAttempts { get; set; }

    // Max students cap feature
    public int MaxStudents { get; set; } = 15;
    public int LimitExtensionCount { get; set; }
    public bool IsCapReached { get; set; }

    // QuizHub new configurations
    public Guid PublicId { get; set; } = Guid.NewGuid(); // Secure public link ID
    public double? NegativeMarkingPoints { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleOptions { get; set; }
    public DateTimeOffset? ExpiryDateUtc { get; set; }
    public bool EnableCertificate { get; set; }
    public bool CertificateForTopperOnly { get; set; }
    public bool AutoSubmit { get; set; } = true;
    public bool ShowResultsAfterSubmission { get; set; } = true;
    public bool ShowCorrectAnswers { get; set; } = true;
    public int TotalMarks { get; set; }
    
    public string? WelcomeMessage { get; set; }
    public string? Instructions { get; set; }
    public string ShortId { get; set; } = GenerateShortId();

    private static string GenerateShortId()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("/", "_")
            .Replace("+", "-")
            .Substring(0, 8);
    }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Navigation properties
    public Lesson? Lesson { get; set; }
    public User? CreatedByUser { get; set; }
    public ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
}

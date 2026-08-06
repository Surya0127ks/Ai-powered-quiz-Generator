namespace LMS.Application.Features.Quizzes.DTOs;

public record UserQuizItemDto(
    Guid Id,
    string Title,
    string Category,
    string Difficulty,
    int QuestionCount,
    int? TimeLimitMinutes,
    bool IsPublished,
    int TotalAttemptsCount,
    double AvgScorePercentage,
    DateTime CreatedAtUtc,
    string ShortId
);

public record UserAttemptItemDto(
    Guid Id,
    Guid QuizId,
    string QuizTitle,
    double ScorePercentage,
    bool IsPassed,
    DateTime SubmittedAtUtc
);

public record UserQuizDashboardSummaryDto(
    int QuizzesCreatedCount,
    int PublishedCount,
    int DraftsCount,
    int TotalAttemptsCount,
    double AvgScorePercentage,
    int CertificatesEarnedCount,
    List<UserQuizItemDto> MyQuizzes,
    List<UserAttemptItemDto> MyAttempts
);

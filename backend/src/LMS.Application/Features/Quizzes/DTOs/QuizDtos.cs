using LMS.Domain.Enums;

namespace LMS.Application.Features.Quizzes.DTOs;

public record QuizOptionDto(
    Guid Id,
    string OptionText,
    int OrderIndex,
    bool? IsCorrect = null
);

public record QuizQuestionDto(
    Guid Id,
    Guid QuizId,
    string QuestionText,
    QuestionType Type,
    int Points,
    int OrderIndex,
    string? Explanation,
    List<QuizOptionDto> Options
);

public record QuizDto(
    Guid Id,
    Guid? LessonId,
    string Title,
    string? Description,
    string? Category,
    string? Difficulty,
    bool IsPublished,
    int PassingScorePercentage,
    int? TimeLimitMinutes,
    int? MaxAttempts,
    Guid PublicId,
    double? NegativeMarkingPoints,
    bool ShuffleQuestions,
    bool ShuffleOptions,
    DateTimeOffset? ExpiryDateUtc,
    bool EnableCertificate,
    bool CertificateForTopperOnly,
    bool AutoSubmit,
    bool ShowResultsAfterSubmission,
    bool ShowCorrectAnswers,
    int TotalMarks,
    string? WelcomeMessage,
    string? Instructions,
    string ShortId,
    Guid? CreatedByUserId,
    List<QuizQuestionDto> Questions,
    int MaxStudents = 15,
    int LimitExtensionCount = 0,
    bool IsCapReached = false
);

public record CreateQuizDto(
    Guid? LessonId,
    string Title,
    string? Description,
    string? Category,
    string? Difficulty,
    bool IsPublished,
    int PassingScorePercentage,
    int? TimeLimitMinutes,
    int? MaxAttempts,
    double? NegativeMarkingPoints,
    bool ShuffleQuestions,
    bool ShuffleOptions,
    DateTimeOffset? ExpiryDateUtc,
    bool EnableCertificate,
    bool CertificateForTopperOnly,
    bool AutoSubmit,
    bool ShowResultsAfterSubmission,
    bool ShowCorrectAnswers,
    int TotalMarks,
    string? WelcomeMessage,
    string? Instructions,
    List<CreateQuizQuestionDto> Questions,
    int MaxStudents = 15
);

public record CreateQuizQuestionDto(
    string QuestionText,
    QuestionType Type,
    int Points,
    string? Explanation,
    List<CreateQuizOptionDto> Options
);

public record CreateQuizOptionDto(
    string OptionText,
    bool IsCorrect
);

public record StudentAnswerItemDto(
    Guid QuestionId,
    Guid? SelectedOptionId,
    List<Guid>? SelectedOptionIds
);

public record SubmitQuizAttemptDto(
    List<StudentAnswerItemDto> Answers,
    string? StudentName = null,
    string? RollNumber = null,
    string? ClassName = null,
    string? Department = null,
    string? Email = null,
    string? PhoneNumber = null,
    int FocusLostCount = 0,
    bool IsDisqualified = false,
    string? DisqualificationReason = null
);

public record QuizAttemptResultDto(
    Guid AttemptId,
    Guid QuizId,
    double ScorePercentage,
    int TotalPointsEarned,
    int TotalPossiblePoints,
    bool IsPassed,
    DateTime SubmittedAtUtc,
    List<AnswerReviewItemDto> Reviews,
    string? CertificateNumber = null,
    bool IsCapReached = false,
    int MaxStudents = 15,
    int LimitExtensionCount = 0
);

public record AnswerReviewItemDto(
    Guid QuestionId,
    string QuestionText,
    int PointsEarned,
    int MaxPoints,
    bool IsCorrect,
    List<Guid> SelectedOptionIds,
    List<Guid> CorrectOptionIds,
    string? Explanation
);

public record QuizLeaderboardItemDto(
    Guid AttemptId,
    Guid StudentUserId,
    string StudentName,
    string StudentEmail,
    double ScorePercentage,
    int TotalPointsEarned,
    int TotalPossiblePoints,
    bool IsPassed,
    DateTime SubmittedAtUtc,
    int Rank,
    int FocusLostCount
);

public record UpdateQuizDto(
    string Title,
    string? Description,
    string? Category,
    string? Difficulty,
    bool IsPublished,
    int PassingScorePercentage,
    int? TimeLimitMinutes,
    int? MaxAttempts,
    double? NegativeMarkingPoints,
    bool ShuffleQuestions,
    bool ShuffleOptions,
    DateTimeOffset? ExpiryDateUtc,
    bool EnableCertificate,
    bool CertificateForTopperOnly,
    bool AutoSubmit,
    bool ShowResultsAfterSubmission,
    bool ShowCorrectAnswers,
    string? WelcomeMessage,
    string? Instructions,
    List<UpdateQuizQuestionDto> Questions,
    int MaxStudents = 15
);

public record UpdateQuizQuestionDto(
    Guid? Id,
    string QuestionText,
    QuestionType Type,
    int Points,
    string? Explanation,
    List<UpdateQuizOptionDto> Options
);

public record UpdateQuizOptionDto(
    Guid? Id,
    string OptionText,
    bool IsCorrect
);

public record AdminAttemptDetailsDto(
    Guid AttemptId,
    Guid QuizId,
    string QuizTitle,
    string StudentName,
    string StudentEmail,
    string? RollNumber,
    string? ClassName,
    string? Department,
    double ScorePercentage,
    int TotalPointsEarned,
    int TotalPossiblePoints,
    bool IsPassed,
    DateTimeOffset? SubmittedAtUtc,
    int FocusLostCount,
    List<AdminAttemptQuestionDto> Questions
);

public record AdminAttemptQuestionDto(
    Guid QuestionId,
    string QuestionText,
    int Points,
    int PointsEarned,
    bool IsCorrect,
    List<AdminAttemptOptionDto> Options,
    List<Guid> SelectedOptionIds,
    string? Explanation
);

public record AdminAttemptOptionDto(
    Guid OptionId,
    string OptionText,
    bool IsCorrect
);

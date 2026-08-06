using LMS.Domain.Enums;

namespace LMS.Application.Features.Assignments.DTOs;

public record AssignmentDto(
    Guid Id,
    Guid LessonId,
    string Title,
    string Instructions,
    int MaxMarks,
    DateTime? DueDateUtc,
    string? AttachmentUrl,
    AssignmentSubmissionDto? MySubmission
);

public record CreateAssignmentDto(
    string Title,
    string Instructions,
    int MaxMarks,
    DateTime? DueDateUtc,
    string? AttachmentUrl
);

public record SubmitAssignmentDto(
    string? Content,
    string? AttachmentUrl // Cloudinary file URL placeholder
);

public record AssignmentSubmissionDto(
    Guid Id,
    Guid AssignmentId,
    Guid StudentId,
    string StudentName,
    string? Content,
    string? AttachmentUrl,
    DateTime SubmittedAtUtc,
    SubmissionStatus Status,
    int? EarnedMarks,
    string? Feedback,
    DateTime? GradedAtUtc
);

public record GradeSubmissionDto(
    int EarnedMarks,
    string? Feedback,
    SubmissionStatus Status
);

using System.Text.Json;
using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Quizzes.DTOs;
using LMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Commands.SubmitQuizAttempt;

public record SubmitQuizAttemptCommand(
    Guid QuizId,
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
) : IRequest<Result<QuizAttemptResultDto>>;

public class SubmitQuizAttemptCommandValidator : AbstractValidator<SubmitQuizAttemptCommand>
{
    public SubmitQuizAttemptCommandValidator()
    {
        RuleFor(x => x.QuizId).NotEmpty();
        RuleFor(x => x.Answers).NotNull();
    }
}

public class SubmitQuizAttemptCommandHandler : IRequestHandler<SubmitQuizAttemptCommand, Result<QuizAttemptResultDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public SubmitQuizAttemptCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<QuizAttemptResultDto>> Handle(SubmitQuizAttemptCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;


        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(ques => ques.Options)
            .FirstOrDefaultAsync(q => q.Id == request.QuizId && !q.IsDeleted, cancellationToken);

        if (quiz == null)
        {
            return Result.Failure<QuizAttemptResultDto>("Quiz not found.");
        }

        var tenantId = _tenantContext.TenantId ?? quiz.TenantId;

        int totalPossiblePoints = quiz.Questions.Sum(q => q.Points);
        int totalEarnedPoints = 0;

        var attempt = new QuizAttempt
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = userId,
            QuizId = request.QuizId,
            StudentName = request.StudentName,
            RollNumber = request.RollNumber,
            ClassName = request.ClassName,
            Department = request.Department,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-5),
            SubmittedAtUtc = DateTimeOffset.UtcNow,
            TotalPossiblePoints = totalPossiblePoints,
            FocusLostCount = request.FocusLostCount,
            IsDisqualified = request.IsDisqualified
        };

        var reviews = new List<AnswerReviewItemDto>();

        foreach (var ques in quiz.Questions)
        {
            var studentAns = request.Answers.FirstOrDefault(a => a.QuestionId == ques.Id);

            var correctOptions = ques.Options.Where(o => o.IsCorrect).Select(o => o.Id).ToList();
            var selectedOptionIds = new List<Guid>();

            if (studentAns != null)
            {
                if (studentAns.SelectedOptionId.HasValue)
                {
                    selectedOptionIds.Add(studentAns.SelectedOptionId.Value);
                }
                else if (studentAns.SelectedOptionIds != null)
                {
                    selectedOptionIds.AddRange(studentAns.SelectedOptionIds);
                }
            }

            bool isCorrect = false;

            if (selectedOptionIds.Count > 0 && correctOptions.Count > 0)
            {
                isCorrect = selectedOptionIds.OrderBy(id => id).SequenceEqual(correctOptions.OrderBy(id => id));
            }

            int pointsEarned = 0;
            if (isCorrect)
            {
                pointsEarned = ques.Points;
            }
            else if (selectedOptionIds.Count > 0 && quiz.NegativeMarkingPoints.HasValue)
            {
                // Convert double to int or just use int for points if total points is int.
                // However, total points is int, so we might need to deduct whole points or round it.
                // For now we'll subtract rounded negative points or keep total points as int.
                pointsEarned = -(int)Math.Round(quiz.NegativeMarkingPoints.Value);
            }

            totalEarnedPoints += pointsEarned;

            attempt.Answers.Add(new QuizAttemptAnswer
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                AttemptId = attempt.Id,
                QuestionId = ques.Id,
                SelectedOptionId = selectedOptionIds.FirstOrDefault(),
                SelectedOptionIdsJson = JsonSerializer.Serialize(selectedOptionIds),
                IsCorrect = isCorrect,
                PointsEarned = pointsEarned
            });

            reviews.Add(new AnswerReviewItemDto(
                ques.Id,
                ques.QuestionText,
                pointsEarned,
                ques.Points,
                isCorrect,
                selectedOptionIds,
                quiz.ShowCorrectAnswers ? correctOptions : new List<Guid>(),
                quiz.ShowCorrectAnswers ? ques.Explanation : null
            ));
        }

        if (!quiz.ShowResultsAfterSubmission)
        {
            reviews.Clear();
        }

        double scorePercentage = totalPossiblePoints > 0
            ? Math.Round((double)totalEarnedPoints / totalPossiblePoints * 100, 2)
            : 0.0;

        bool isPassed = scorePercentage >= quiz.PassingScorePercentage;

        attempt.ScorePercentage = scorePercentage;
        attempt.TotalPointsEarned = totalEarnedPoints;
        attempt.IsPassed = isPassed;
        attempt.MarkAsCreated(userId ?? Guid.Empty);

        _context.QuizAttempts.Add(attempt);
        await _context.SaveChangesAsync(cancellationToken);

        // --- Max Students Cap Logic ---
        // Count total completed attempts for this quiz
        var attemptCount = await _context.QuizAttempts
            .CountAsync(a => a.QuizId == quiz.Id, cancellationToken);

        bool isCapReached = false;
        if (attemptCount >= quiz.MaxStudents)
        {
            isCapReached = true;
            quiz.IsCapReached = true;

            if (quiz.LimitExtensionCount >= 2)
            {
                // Admin used all 2 extensions — permanently soft-delete the quiz
                quiz.IsDeleted = true;
                quiz.DeletedAt = DateTimeOffset.UtcNow;
            }
            // If extensions remain, mark cap reached but don't delete yet (admin can extend)

            await _context.SaveChangesAsync(cancellationToken);
        }

        // Auto-mark lesson completion if passed (when linked to a lesson and user is logged in)
        if (isPassed && quiz.LessonId.HasValue && userId.HasValue)
        {
            var lessonId = quiz.LessonId.Value;
            var completion = await _context.LessonCompletions
                .FirstOrDefaultAsync(c => c.UserId == userId.Value && c.LessonId == lessonId, cancellationToken);

            if (completion == null)
            {
                completion = new LessonCompletion
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    UserId = userId.Value,
                    LessonId = lessonId,
                    IsCompleted = true,
                    CompletedAtUtc = DateTimeOffset.UtcNow
                };
                completion.MarkAsCreated(userId.Value);
                _context.LessonCompletions.Add(completion);
            }
            else
            {
                completion.IsCompleted = true;
                completion.CompletedAtUtc = DateTimeOffset.UtcNow;
                completion.MarkAsModified(userId.Value);
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        string? certificateNumber = null;
        if (isPassed && quiz.EnableCertificate && !quiz.CertificateForTopperOnly)
        {
            var certNum = $"CERT-QUIZ-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
            var cert = new Certificate
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = userId,
                QuizId = quiz.Id,
                QuizAttemptId = attempt.Id,
                StudentName = attempt.StudentName,
                RollNumber = attempt.RollNumber,
                ScorePercentage = scorePercentage,
                CertificateNumber = certNum,
                IssuedAtUtc = DateTimeOffset.UtcNow,
                PdfUrl = $"/api/public/certificates/{certNum}/pdf",
                QrCodeUrl = $"/api/public/certificates/{certNum}/qr",
                IsDeleted = false
            };
            cert.MarkAsCreated(userId ?? Guid.Empty);
            _context.Certificates.Add(cert);
            await _context.SaveChangesAsync(cancellationToken);
            certificateNumber = certNum;
        }

        // --- Topper Certificate Logic ---
        if (quiz.EnableCertificate && quiz.CertificateForTopperOnly && isCapReached)
        {
            // Find the highest score for this quiz across all completed, non-disqualified attempts
            var maxScore = await _context.QuizAttempts
                .Where(a => a.QuizId == quiz.Id && !a.IsDisqualified)
                .MaxAsync(a => (double?)a.ScorePercentage, cancellationToken) ?? 0;

            if (maxScore >= quiz.PassingScorePercentage)
            {
                var topAttempts = await _context.QuizAttempts
                    .Where(a => a.QuizId == quiz.Id && !a.IsDisqualified && a.ScorePercentage == maxScore)
                    .ToListAsync(cancellationToken);

                foreach (var topAttempt in topAttempts)
                {
                    var hasCert = await _context.Certificates.AnyAsync(c => c.QuizAttemptId == topAttempt.Id, cancellationToken);
                    if (!hasCert)
                    {
                        var certNum = $"CERT-QUIZ-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
                        var cert = new Certificate
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            UserId = topAttempt.UserId,
                            QuizId = quiz.Id,
                            QuizAttemptId = topAttempt.Id,
                            StudentName = topAttempt.StudentName,
                            RollNumber = topAttempt.RollNumber,
                            ScorePercentage = topAttempt.ScorePercentage,
                            CertificateNumber = certNum,
                            IssuedAtUtc = DateTimeOffset.UtcNow,
                            PdfUrl = $"/api/public/certificates/{certNum}/pdf",
                            QrCodeUrl = $"/api/public/certificates/{certNum}/qr",
                            IsDeleted = false
                        };
                        cert.MarkAsCreated(topAttempt.UserId ?? Guid.Empty);
                        _context.Certificates.Add(cert);

                        if (topAttempt.Id == attempt.Id)
                        {
                            certificateNumber = certNum;
                        }
                    }
                }
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        var resultDto = new QuizAttemptResultDto(
            attempt.Id,
            attempt.QuizId,
            scorePercentage,
            totalEarnedPoints,
            totalPossiblePoints,
            isPassed,
            attempt.SubmittedAtUtc.Value.UtcDateTime,
            reviews,
            certificateNumber,
            isCapReached,
            quiz.MaxStudents,
            quiz.LimitExtensionCount
        );

        return Result.Success(resultDto);
    }
}

using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Quizzes.DTOs;
using LMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Commands.CreateQuiz;

public record CreateQuizCommand(
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
) : IRequest<Result<QuizDto>>;

public class CreateQuizCommandValidator : AbstractValidator<CreateQuizCommand>
{
    public CreateQuizCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.PassingScorePercentage).InclusiveBetween(1, 100);
        RuleFor(x => x.Questions).NotEmpty();
    }
}

public class CreateQuizCommandHandler : IRequestHandler<CreateQuizCommand, Result<QuizDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public CreateQuizCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<QuizDto>> Handle(CreateQuizCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId ?? Guid.Empty;

        var quiz = new Quiz
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            LessonId = request.LessonId,
            CreatedByUserId = _currentUserService.UserId,
            Title = request.Title,
            Description = request.Description,
            Category = request.Category ?? "General",
            Difficulty = request.Difficulty ?? "Intermediate",
            IsPublished = request.IsPublished,
            PassingScorePercentage = request.PassingScorePercentage,
            TimeLimitMinutes = request.TimeLimitMinutes,
            MaxAttempts = request.MaxAttempts,
            NegativeMarkingPoints = request.NegativeMarkingPoints,
            ShuffleQuestions = request.ShuffleQuestions,
            ShuffleOptions = request.ShuffleOptions,
            ExpiryDateUtc = request.ExpiryDateUtc,
            EnableCertificate = request.EnableCertificate,
            CertificateForTopperOnly = request.CertificateForTopperOnly,
            AutoSubmit = request.AutoSubmit,
            ShowResultsAfterSubmission = request.ShowResultsAfterSubmission,
            ShowCorrectAnswers = request.ShowCorrectAnswers,
            TotalMarks = request.TotalMarks,
            WelcomeMessage = request.WelcomeMessage,
            Instructions = request.Instructions,
            MaxStudents = request.MaxStudents > 0 ? request.MaxStudents : 15,
            IsDeleted = false
        };

        quiz.MarkAsCreated(_currentUserService.UserId);

        int qIndex = 1;
        foreach (var qDto in request.Questions)
        {
            var question = new QuizQuestion
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                QuizId = quiz.Id,
                QuestionText = qDto.QuestionText,
                Type = qDto.Type,
                Points = qDto.Points > 0 ? qDto.Points : 1,
                OrderIndex = qIndex++,
                Explanation = qDto.Explanation
            };
            question.MarkAsCreated(_currentUserService.UserId);

            int oIndex = 1;
            foreach (var oDto in qDto.Options)
            {
                question.Options.Add(new QuizOption
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    QuestionId = question.Id,
                    OptionText = oDto.OptionText,
                    IsCorrect = oDto.IsCorrect,
                    OrderIndex = oIndex++
                });
            }

            quiz.Questions.Add(question);
        }

        _context.Quizzes.Add(quiz);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new QuizDto(
            quiz.Id,
            quiz.LessonId,
            quiz.Title,
            quiz.Description,
            quiz.Category,
            quiz.Difficulty,
            quiz.IsPublished,
            quiz.PassingScorePercentage,
            quiz.TimeLimitMinutes,
            quiz.MaxAttempts,
            quiz.PublicId,
            quiz.NegativeMarkingPoints,
            quiz.ShuffleQuestions,
            quiz.ShuffleOptions,
            quiz.ExpiryDateUtc,
            quiz.EnableCertificate,
            quiz.CertificateForTopperOnly,
            quiz.AutoSubmit,
            quiz.ShowResultsAfterSubmission,
            quiz.ShowCorrectAnswers,
            quiz.TotalMarks,
            quiz.WelcomeMessage,
            quiz.Instructions,
            quiz.ShortId,
            quiz.CreatedByUserId,
            quiz.Questions.OrderBy(q => q.OrderIndex).Select(ques => new QuizQuestionDto(
                ques.Id,
                ques.QuizId,
                ques.QuestionText,
                ques.Type,
                ques.Points,
                ques.OrderIndex,
                ques.Explanation,
                ques.Options.Select(o => new QuizOptionDto(o.Id, o.OptionText, o.OrderIndex, o.IsCorrect)).ToList()
            )).ToList(),
            quiz.MaxStudents,
            quiz.LimitExtensionCount,
            quiz.IsCapReached
        );

        return Result.Success(dto);
    }
}

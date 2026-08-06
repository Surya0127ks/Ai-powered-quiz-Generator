using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Quizzes.DTOs;
using LMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Commands.UpdateQuiz;

public record UpdateQuizCommand(
    Guid QuizId,
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
) : IRequest<Result<QuizDto>>;

public class UpdateQuizCommandValidator : AbstractValidator<UpdateQuizCommand>
{
    public UpdateQuizCommandValidator()
    {
        RuleFor(x => x.QuizId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.PassingScorePercentage).InclusiveBetween(0, 100);
        RuleFor(x => x.Questions).NotEmpty();
    }
}

public class UpdateQuizCommandHandler : IRequestHandler<UpdateQuizCommand, Result<QuizDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateQuizCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<QuizDto>> Handle(UpdateQuizCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<QuizDto>("Unauthorized");
        }

        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == request.QuizId && !q.IsDeleted, cancellationToken);

        if (quiz == null)
        {
            return Result.Failure<QuizDto>("Quiz not found.");
        }

        if (quiz.CreatedByUserId != _currentUserService.UserId)
        {
            return Result.Failure<QuizDto>("You can only edit your own quizzes.");
        }

        // Update properties
        quiz.Title = request.Title;
        quiz.Description = request.Description;
        quiz.Category = request.Category;
        quiz.Difficulty = request.Difficulty;
        quiz.IsPublished = request.IsPublished;
        quiz.PassingScorePercentage = request.PassingScorePercentage;
        quiz.TimeLimitMinutes = request.TimeLimitMinutes;
        quiz.MaxAttempts = request.MaxAttempts;
        quiz.NegativeMarkingPoints = request.NegativeMarkingPoints;
        quiz.ShuffleQuestions = request.ShuffleQuestions;
        quiz.ShuffleOptions = request.ShuffleOptions;
        quiz.ExpiryDateUtc = request.ExpiryDateUtc;
        quiz.EnableCertificate = request.EnableCertificate;
        quiz.CertificateForTopperOnly = request.CertificateForTopperOnly;
        quiz.AutoSubmit = request.AutoSubmit;
        quiz.ShowResultsAfterSubmission = request.ShowResultsAfterSubmission;
        quiz.ShowCorrectAnswers = request.ShowCorrectAnswers;
        quiz.WelcomeMessage = request.WelcomeMessage;
        quiz.Instructions = request.Instructions;
        quiz.MaxStudents = request.MaxStudents;

        int totalMarks = 0;

        // Manage Questions
        var existingQuestionIds = quiz.Questions.Select(q => q.Id).ToList();
        var requestQuestionIds = request.Questions.Where(q => q.Id.HasValue).Select(q => q.Id!.Value).ToList();

        // 1. Remove questions that are not in the request
        var questionsToRemove = quiz.Questions.Where(q => !requestQuestionIds.Contains(q.Id)).ToList();
        foreach (var q in questionsToRemove)
        {
            quiz.Questions.Remove(q);
        }

        // 2. Add or Update Questions
        for (int i = 0; i < request.Questions.Count; i++)
        {
            var reqQues = request.Questions[i];
            totalMarks += reqQues.Points;

            QuizQuestion? existingQues = null;
            if (reqQues.Id.HasValue)
            {
                existingQues = quiz.Questions.FirstOrDefault(q => q.Id == reqQues.Id.Value);
            }

            if (existingQues != null)
            {
                // Update existing question
                existingQues.QuestionText = reqQues.QuestionText;
                existingQues.Type = reqQues.Type;
                existingQues.Points = reqQues.Points;
                existingQues.Explanation = reqQues.Explanation;
                existingQues.OrderIndex = i;
                existingQues.MarkAsModified(_currentUserService.UserId.Value);

                // Manage Options
                var existingOptionIds = existingQues.Options.Select(o => o.Id).ToList();
                var reqOptionIds = reqQues.Options.Where(o => o.Id.HasValue).Select(o => o.Id!.Value).ToList();

                var optionsToRemove = existingQues.Options.Where(o => !reqOptionIds.Contains(o.Id)).ToList();
                foreach (var o in optionsToRemove)
                {
                    existingQues.Options.Remove(o);
                }

                for (int j = 0; j < reqQues.Options.Count; j++)
                {
                    var reqOpt = reqQues.Options[j];
                    QuizOption? existingOpt = null;
                    if (reqOpt.Id.HasValue)
                    {
                        existingOpt = existingQues.Options.FirstOrDefault(o => o.Id == reqOpt.Id.Value);
                    }

                    if (existingOpt != null)
                    {
                        existingOpt.OptionText = reqOpt.OptionText;
                        existingOpt.IsCorrect = reqOpt.IsCorrect;
                        existingOpt.OrderIndex = j;
                    }
                    else
                    {
                        existingQues.Options.Add(new QuizOption
                        {
                            Id = Guid.NewGuid(),
                            TenantId = quiz.TenantId,
                            OptionText = reqOpt.OptionText,
                            IsCorrect = reqOpt.IsCorrect,
                            OrderIndex = j
                        });
                    }
                }
            }
            else
            {
                // Add new question
                var newQues = new QuizQuestion
                {
                    Id = Guid.NewGuid(),
                    TenantId = quiz.TenantId,
                    QuestionText = reqQues.QuestionText,
                    Type = reqQues.Type,
                    Points = reqQues.Points,
                    Explanation = reqQues.Explanation,
                    OrderIndex = i,
                    Options = reqQues.Options.Select((o, j) => new QuizOption
                    {
                        Id = Guid.NewGuid(),
                        TenantId = quiz.TenantId,
                        OptionText = o.OptionText,
                        IsCorrect = o.IsCorrect,
                        OrderIndex = j
                    }).ToList()
                };
                newQues.MarkAsCreated(_currentUserService.UserId.Value);
                quiz.Questions.Add(newQues);
            }
        }

        quiz.TotalMarks = totalMarks;
        quiz.MarkAsModified(_currentUserService.UserId.Value);

        await _context.SaveChangesAsync(cancellationToken);

        // Map back to DTO
        var mappedDto = new QuizDto(
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
            quiz.Questions.OrderBy(q => q.OrderIndex).Select(q => new QuizQuestionDto(
                q.Id,
                q.QuizId,
                q.QuestionText,
                q.Type,
                q.Points,
                q.OrderIndex,
                q.Explanation,
                q.Options.OrderBy(o => o.OrderIndex).Select(o => new QuizOptionDto(
                    o.Id,
                    o.OptionText,
                    o.OrderIndex,
                    o.IsCorrect
                )).ToList()
            )).ToList()
        );

        return Result.Success(mappedDto);
    }
}

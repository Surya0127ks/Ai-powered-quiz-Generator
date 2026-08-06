using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Quizzes.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Queries.GetQuizById;

public record GetQuizByIdQuery(Guid QuizId) : IRequest<Result<QuizDto>>;

public class GetQuizByIdQueryHandler : IRequestHandler<GetQuizByIdQuery, Result<QuizDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetQuizByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<QuizDto>> Handle(GetQuizByIdQuery request, CancellationToken cancellationToken)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(ques => ques.Options)
            .FirstOrDefaultAsync(q => q.Id == request.QuizId && !q.IsDeleted, cancellationToken);

        if (quiz == null)
        {
            return Result.Failure<QuizDto>("Quiz assessment not found.");
        }

        bool isCreator = _currentUserService.UserId != null && quiz.CreatedByUserId != null && _currentUserService.UserId.ToString() == quiz.CreatedByUserId.ToString();

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
                ques.Options.OrderBy(o => o.OrderIndex).Select(o => new QuizOptionDto(
                    o.Id, 
                    o.OptionText, 
                    o.OrderIndex, 
                    isCreator ? o.IsCorrect : null
                )).ToList()
            )).ToList()
        );

        return Result.Success(dto);
    }
}

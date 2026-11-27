using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Quizzes.DTOs;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Queries.GetQuizByLesson;

public record GetQuizByLessonQuery(Guid LessonId) : IRequest<Result<QuizDto>>;

public class GetQuizByLessonQueryHandler : IRequestHandler<GetQuizByLessonQuery, Result<QuizDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetQuizByLessonQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<QuizDto>> Handle(GetQuizByLessonQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        var now = DateTimeOffset.UtcNow;
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(ques => ques.Options)
            .Include(q => q.CreatedByUser)
            .FirstOrDefaultAsync(q => q.LessonId == request.LessonId && !q.IsDeleted &&
                ((q.IsPublished && !q.IsCapReached && (!q.ExpiryDateUtc.HasValue || q.ExpiryDateUtc > now) &&
                  (q.CreatedByUser == null || q.CreatedByUser.Role != UserRole.Student)) ||
                 (currentUserId.HasValue && q.CreatedByUserId == currentUserId)), cancellationToken);

        if (quiz == null)
        {
            return Result.Failure<QuizDto>("No quiz found for this lesson.");
        }

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
            quiz.Questions
                .OrderBy(q => q.OrderIndex)
                .Select(ques => new QuizQuestionDto(
                    ques.Id,
                    ques.QuizId,
                    ques.QuestionText,
                    ques.Type,
                    ques.Points,
                    ques.OrderIndex,
                    ques.Explanation,
                    ques.Options
                        .OrderBy(o => o.OrderIndex)
                        .Select(o => new QuizOptionDto(o.Id, o.OptionText, o.OrderIndex))
                        .ToList()
                )).ToList()
        );

        return Result.Success(dto);
    }
}

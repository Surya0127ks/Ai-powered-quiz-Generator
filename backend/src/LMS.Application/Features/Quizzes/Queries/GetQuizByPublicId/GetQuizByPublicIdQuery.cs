using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Quizzes.DTOs;
using LMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Queries.GetQuizByPublicId;

public record GetQuizByPublicIdQuery(string ShortId) : IRequest<Result<QuizDto>>;

public class GetQuizByPublicIdQueryHandler : IRequestHandler<GetQuizByPublicIdQuery, Result<QuizDto>>
{
    private readonly IApplicationDbContext _context;

    public GetQuizByPublicIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<QuizDto>> Handle(GetQuizByPublicIdQuery request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(ques => ques.Options)
            .Include(q => q.CreatedByUser)
            .FirstOrDefaultAsync(q => q.ShortId == request.ShortId && !q.IsDeleted && q.IsPublished &&
                !q.IsCapReached && (!q.ExpiryDateUtc.HasValue || q.ExpiryDateUtc > now) &&
                (q.CreatedByUser == null || q.CreatedByUser.Role != UserRole.Student), cancellationToken);

        if (quiz == null)
        {
            return Result.Failure<QuizDto>("Public quiz not found or not published.");
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
            quiz.Questions.OrderBy(q => q.OrderIndex).Select(ques => new QuizQuestionDto(
                ques.Id,
                ques.QuizId,
                ques.QuestionText,
                ques.Type,
                ques.Points,
                ques.OrderIndex,
                ques.Explanation,
                ques.Options.OrderBy(o => o.OrderIndex).Select(o => new QuizOptionDto(o.Id, o.OptionText, o.OrderIndex)).ToList(),
                ques.Tag
            )).ToList()
        );

        return Result.Success(dto);
    }
}

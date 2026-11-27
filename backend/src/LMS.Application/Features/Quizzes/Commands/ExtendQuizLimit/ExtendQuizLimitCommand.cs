using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Commands.ExtendQuizLimit;

public record ExtendQuizLimitCommand(Guid QuizId) : IRequest<Result<ExtendQuizLimitResult>>;

public record ExtendQuizLimitResult(
    bool Success,
    int NewMaxStudents,
    int LimitExtensionCount,
    string Message
);

public class ExtendQuizLimitCommandHandler : IRequestHandler<ExtendQuizLimitCommand, Result<ExtendQuizLimitResult>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ExtendQuizLimitCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<ExtendQuizLimitResult>> Handle(ExtendQuizLimitCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId is not { } userId)
            return Result.Failure<ExtendQuizLimitResult>("Sign in to manage this quiz.");

        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == request.QuizId && !q.IsDeleted, cancellationToken);

        if (quiz == null)
            return Result.Failure<ExtendQuizLimitResult>("Quiz not found.");

        if (quiz.CreatedByUserId != userId)
            return Result.Failure<ExtendQuizLimitResult>("You can only extend limits for your own quizzes.");

        if (quiz.LimitExtensionCount >= 2)
            return Result.Failure<ExtendQuizLimitResult>("Maximum extensions (2) already used. This quiz cannot be extended further.");

        if (quiz.MaxStudents >= LMS.Domain.Entities.Quiz.MaxAllowedStudentsPerQuiz)
            return Result.Failure<ExtendQuizLimitResult>($"Maximum limit of {LMS.Domain.Entities.Quiz.MaxAllowedStudentsPerQuiz} students per quiz has already been reached.");

        // Extend by up to 15 slots, capped at 50 max students per quiz
        quiz.MaxStudents = Math.Min(LMS.Domain.Entities.Quiz.MaxAllowedStudentsPerQuiz, quiz.MaxStudents + 15);
        quiz.LimitExtensionCount += 1;
        quiz.IsCapReached = false;
        quiz.IsDeleted = false;
        quiz.DeletedAt = null;

        await _context.SaveChangesAsync(cancellationToken);

        var extensionsLeft = 2 - quiz.LimitExtensionCount;
        var message = extensionsLeft > 0
            ? $"Quiz extended to {quiz.MaxStudents} students. You have {extensionsLeft} extension(s) remaining."
            : $"Quiz extended to {quiz.MaxStudents} students. This was your last extension — no more allowed.";

        return Result.Success(new ExtendQuizLimitResult(
            true,
            quiz.MaxStudents,
            quiz.LimitExtensionCount,
            message
        ));
    }
}

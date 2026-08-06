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
        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == request.QuizId, cancellationToken);

        if (quiz == null)
            return Result.Failure<ExtendQuizLimitResult>("Quiz not found.");

        if (quiz.LimitExtensionCount >= 2)
            return Result.Failure<ExtendQuizLimitResult>("Maximum extensions (2) already used. This quiz cannot be extended further.");

        // Extend: add 15 more slots, increment extension count, clear cap flag, un-soft-delete
        quiz.MaxStudents += 15;
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

using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Commands.ClearUserQuizAttempts;

public record ClearUserQuizAttemptsCommand(Guid UserId) : IRequest<Result<bool>>;

public class ClearUserQuizAttemptsCommandHandler : IRequestHandler<ClearUserQuizAttemptsCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public ClearUserQuizAttemptsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(ClearUserQuizAttemptsCommand request, CancellationToken cancellationToken)
    {
        var attempts = await _context.QuizAttempts
            .Where(a => a.UserId == request.UserId)
            .ToListAsync(cancellationToken);

        if (attempts.Count > 0)
        {
            var attemptIds = attempts.Select(a => a.Id).ToList();
            var answers = await _context.QuizAttemptAnswers
                .Where(ans => attemptIds.Contains(ans.AttemptId))
                .ToListAsync(cancellationToken);

            _context.QuizAttemptAnswers.RemoveRange(answers);
            _context.QuizAttempts.RemoveRange(attempts);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result.Success(true);
    }
}

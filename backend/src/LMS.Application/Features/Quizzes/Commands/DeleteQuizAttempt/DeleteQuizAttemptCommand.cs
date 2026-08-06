using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Commands.DeleteQuizAttempt;

public record DeleteQuizAttemptCommand(Guid AttemptId, Guid UserId) : IRequest<Result<bool>>;

public class DeleteQuizAttemptCommandHandler : IRequestHandler<DeleteQuizAttemptCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public DeleteQuizAttemptCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(DeleteQuizAttemptCommand request, CancellationToken cancellationToken)
    {
        var attempt = await _context.QuizAttempts
            .FirstOrDefaultAsync(a => a.Id == request.AttemptId && a.UserId == request.UserId, cancellationToken);

        if (attempt == null)
        {
            return Result.Failure<bool>("Attempt record not found or not owned by user.");
        }

        var answers = await _context.QuizAttemptAnswers
            .Where(ans => ans.AttemptId == attempt.Id)
            .ToListAsync(cancellationToken);

        _context.QuizAttemptAnswers.RemoveRange(answers);
        _context.QuizAttempts.Remove(attempt);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(true);
    }
}

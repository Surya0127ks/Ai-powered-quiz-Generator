using LMS.Application.Common.Interfaces;
using LMS.Domain.Common;
using LMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Quizzes.Commands.DeleteQuiz;

public record DeleteQuizCommand(Guid QuizId) : IRequest<Result<bool>>;

public class DeleteQuizCommandHandler : IRequestHandler<DeleteQuizCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteQuizCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<bool>> Handle(DeleteQuizCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return Result.Failure<bool>("Unauthorized.");
        }

        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == request.QuizId && !q.IsDeleted, cancellationToken);

        if (quiz == null)
        {
            return Result.Failure<bool>("Quiz not found.");
        }

        if (quiz.CreatedByUserId != _currentUserService.UserId)
        {
            return Result.Failure<bool>("You can only delete your own quizzes.");
        }

        quiz.IsDeleted = true;
        quiz.DeletedAt = DateTimeOffset.UtcNow;
        quiz.DeletedBy = _currentUserService.UserId;

        _context.Quizzes.Update(quiz);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(true);
    }
}

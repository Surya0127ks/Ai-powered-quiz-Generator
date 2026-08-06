using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Sections.Commands.SoftDeleteSection;

public record SoftDeleteSectionCommand(Guid Id) : IRequest<Result>;

public class SoftDeleteSectionCommandHandler : IRequestHandler<SoftDeleteSectionCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SoftDeleteSectionCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(SoftDeleteSectionCommand request, CancellationToken cancellationToken)
    {
        var section = await _context.Sections
            .Include(s => s.Lessons)
            .FirstOrDefaultAsync(s => s.Id == request.Id && !s.IsDeleted, cancellationToken);

        if (section == null)
        {
            return Result.Failure("Section not found.");
        }

        section.IsDeleted = true;
        section.DeletedAt = DateTimeOffset.UtcNow;
        section.DeletedBy = _currentUserService.UserId;

        // Cascade soft delete to lessons in this section
        foreach (var lesson in section.Lessons)
        {
            lesson.IsDeleted = true;
            lesson.DeletedAt = DateTimeOffset.UtcNow;
            lesson.DeletedBy = _currentUserService.UserId;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

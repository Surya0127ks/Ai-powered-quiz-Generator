using FluentValidation;
using LMS.Application.Common.Interfaces;
using LMS.Application.Common.Models;
using LMS.Application.Features.Courses.DTOs;
using LMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Features.Courses.Commands.CreateCategory;

public record CreateCategoryCommand(
    string Name,
    string? Description,
    Guid? ParentCategoryId
) : IRequest<Result<CategoryDto>>;

public class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(150).WithMessage("Category name cannot exceed 150 characters.");
    }
}

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Result<CategoryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public CreateCategoryCommandHandler(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        if (_tenantContext.TenantId == null)
        {
            return Result.Failure<CategoryDto>("Tenant context is required to create a category.");
        }

        var slug = request.Name.ToLowerInvariant().Replace(' ', '-');
        var tenantId = _tenantContext.TenantId.Value;

        var existing = await _context.Categories
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Slug == slug && !c.IsDeleted, cancellationToken);

        if (existing != null)
        {
            return Result.Failure<CategoryDto>("A category with this name already exists.");
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = request.Name,
            Slug = slug,
            Description = request.Description,
            ParentCategoryId = request.ParentCategoryId,
            IsActive = true,
            IsDeleted = false
        };

        category.MarkAsCreated(_currentUserService.UserId);
        _context.Categories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new CategoryDto(
            category.Id,
            category.TenantId,
            category.Name,
            category.Slug,
            category.Description,
            category.ParentCategoryId,
            category.IsActive
        );

        return Result.Success(dto);
    }
}

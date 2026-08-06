namespace LMS.Domain.Common;

/// <summary>
/// Base class for entities that require audit tracking.
/// Provides created/modified timestamps and user references.
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ModifiedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? ModifiedBy { get; set; }

    /// <summary>
    /// Marks the entity as created by the specified user.
    /// </summary>
    /// <param name="userId">The identifier of the user creating the entity.</param>
    public void MarkAsCreated(Guid? userId)
    {
        CreatedAt = DateTimeOffset.UtcNow;
        CreatedBy = userId;
    }

    /// <summary>
    /// Marks the entity as modified by the specified user.
    /// </summary>
    /// <param name="userId">The identifier of the user modifying the entity.</param>
    public void MarkAsModified(Guid? userId)
    {
        ModifiedAt = DateTimeOffset.UtcNow;
        ModifiedBy = userId;
    }
}
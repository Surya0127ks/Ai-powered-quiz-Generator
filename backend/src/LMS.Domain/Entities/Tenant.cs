using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a tenant in the multi-tenant LMS system.
/// </summary>
public class Tenant : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty; // e.g. "acme-corp"
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
}

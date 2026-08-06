using LMS.Domain.Common;
using LMS.Domain.Enums;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a user within the multi-tenant LMS system.
/// </summary>
public class User : AuditableEntity
{
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Student;
    public bool IsActive { get; set; } = true;

    // Refresh Token Management
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
}

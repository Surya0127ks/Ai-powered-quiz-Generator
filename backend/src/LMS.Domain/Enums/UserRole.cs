namespace LMS.Domain.Enums;

/// <summary>
/// Defines the roles available for users in the multi-tenant LMS system.
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Global system administrator with access across all tenants.
    /// </summary>
    SuperAdmin = 0,

    /// <summary>
    /// Tenant administrator with management control over their organization.
    /// </summary>
    TenantAdmin = 1,

    /// <summary>
    /// Instructor who creates and manages courses and grades assessments.
    /// </summary>
    Instructor = 2,

    /// <summary>
    /// Student who enrolls in and consumes courses.
    /// </summary>
    Student = 3
}
namespace LMS.Application.Common.Interfaces;

/// <summary>
/// Provides resolution of the current tenant context for multi-tenant isolation.
/// </summary>
public interface ITenantContext
{
    /// <summary>
    /// Gets the unique identifier of the active tenant, if available.
    /// </summary>
    Guid? TenantId { get; }

    /// <summary>
    /// Gets the tenant code/slug (e.g. "acme-corp").
    /// </summary>
    string? TenantIdentifier { get; }
}

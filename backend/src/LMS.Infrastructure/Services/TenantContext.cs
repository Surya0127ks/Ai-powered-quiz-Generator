using LMS.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace LMS.Infrastructure.Services;

/// <summary>
/// Resolves current tenant context from HTTP request headers or JWT claims.
/// </summary>
public class TenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? TenantId
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            // 1. Try header X-Tenant-ID
            if (httpContext.Request.Headers.TryGetValue("X-Tenant-ID", out var tenantHeader) &&
                Guid.TryParse(tenantHeader.ToString(), out var parsedHeaderGuid))
            {
                return parsedHeaderGuid;
            }

            // 2. Try JWT claim "tenant_id"
            var tenantClaim = httpContext.User.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var parsedClaimGuid))
            {
                return parsedClaimGuid;
            }

            return null;
        }
    }

    public string? TenantIdentifier
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            // 1. Try header X-Tenant-Slug
            if (httpContext.Request.Headers.TryGetValue("X-Tenant-Slug", out var slugHeader))
            {
                return slugHeader.ToString();
            }

            // 2. Try JWT claim "tenant_slug"
            return httpContext.User.FindFirst("tenant_slug")?.Value;
        }
    }
}

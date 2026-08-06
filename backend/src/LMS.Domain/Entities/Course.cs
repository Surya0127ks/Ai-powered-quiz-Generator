using LMS.Domain.Common;
using LMS.Domain.Enums;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a course entity in the multi-tenant LMS system.
/// </summary>
public class Course : AuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid InstructorId { get; set; }
    public Guid CategoryId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public CourseLevel Level { get; set; } = CourseLevel.Beginner;
    public string Language { get; set; } = "English";

    /// <summary>
    /// Cloudinary thumbnail URL or placeholder.
    /// </summary>
    public string? ThumbnailUrl { get; set; }

    // Pricing
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }
    public bool IsFree { get; set; }
    public string Currency { get; set; } = "USD";

    // Status state machine
    public CourseStatus Status { get; set; } = CourseStatus.Draft;

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public User Instructor { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<CourseTag> Tags { get; set; } = new List<CourseTag>();
}

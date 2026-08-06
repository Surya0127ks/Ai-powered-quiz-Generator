using LMS.Domain.Common;

namespace LMS.Domain.Entities;

/// <summary>
/// Represents a tag associated with courses for searchability.
/// </summary>
public class CourseTag : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    // Navigation properties
    public ICollection<Course> Courses { get; set; } = new List<Course>();
}

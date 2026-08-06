using AutoMapper;

namespace LMS.Application.Mappings;

/// <summary>
/// Base class for AutoMapper profiles.
/// Inherit from this class to define mapping configurations for each feature module.
/// </summary>
public abstract class MappingProfile : Profile
{
    protected MappingProfile()
    {
    }
}
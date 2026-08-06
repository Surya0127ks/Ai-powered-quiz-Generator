namespace LMS.Domain.Exceptions;

/// <summary>
/// Exception type for domain-level validation and business rule violations.
/// Thrown when a domain invariant is violated.
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message)
    {
    }

    public DomainException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
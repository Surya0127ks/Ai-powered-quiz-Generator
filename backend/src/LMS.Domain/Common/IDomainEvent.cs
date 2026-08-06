namespace LMS.Domain.Common;

/// <summary>
/// Marker interface for domain events.
/// Domain events represent something meaningful that happened in the domain.
/// Implemented as MediatR INotification in the Application layer via a bridge.
/// </summary>
public interface IDomainEvent
{
    /// <summary>
    /// The UTC timestamp when the event was raised.
    /// </summary>
    DateTimeOffset OccurredOn { get; }
}
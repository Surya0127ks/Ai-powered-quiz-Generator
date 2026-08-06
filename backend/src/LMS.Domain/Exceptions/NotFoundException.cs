namespace LMS.Domain.Exceptions;

/// <summary>
/// Exception thrown when an entity is not found in the data store.
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException(string entityName, object key)
        : base($"Entity \"{entityName}\" ({key}) was not found.")
    {
        EntityName = entityName;
        Key = key;
    }

    /// <summary>
    /// The name of the entity type that was not found.
    /// </summary>
    public string EntityName { get; }

    /// <summary>
    /// The key used to look up the entity.
    /// </summary>
    public object Key { get; }
}
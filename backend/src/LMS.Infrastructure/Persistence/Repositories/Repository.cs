using LMS.Domain.Common;
using LMS.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LMS.Infrastructure.Persistence.Repositories;

/// <summary>
/// Generic repository implementation using Entity Framework Core.
/// </summary>
/// <typeparam name="TEntity">The entity type managed by this repository.</typeparam>
public class Repository<TEntity> : IRepository<TEntity> where TEntity : BaseEntity
{
    private readonly DbContext _context;
    private readonly DbSet<TEntity> _dbSet;

    /// <summary>
    /// Gets the DbContext for derived classes.
    /// </summary>
    protected DbContext Context => _context;

    /// <summary>
    /// Gets the DbSet for derived classes.
    /// </summary>
    protected DbSet<TEntity> DbSet => _dbSet;

    public Repository(DbContext context)
    {
        _context = context;
        _dbSet = context.Set<TEntity>();
    }

    /// <inheritdoc/>
    public async Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<IReadOnlyList<TEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet.AsNoTracking().ToListAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public void Add(TEntity entity)
    {
        DbSet.Add(entity);
    }

    /// <inheritdoc/>
    public void AddRange(IEnumerable<TEntity> entities)
    {
        DbSet.AddRange(entities);
    }

    /// <inheritdoc/>
    public void Remove(TEntity entity)
    {
        DbSet.Remove(entity);
    }

    /// <inheritdoc/>
    public void Update(TEntity entity)
    {
        DbSet.Update(entity);
    }
}
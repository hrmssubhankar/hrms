using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using YahwehHrms.Core.Entities;
using YahwehHrms.Core.Interfaces;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.Infrastructure.Services;

public class DepartmentService : IDepartmentService
{
    private readonly HrmsDbContext _db;
    private readonly ILogger<DepartmentService> _log;

    public DepartmentService(HrmsDbContext db, ILogger<DepartmentService> log)
    {
        _db  = db;
        _log = log;
    }

    // ── Departments ───────────────────────────────────────────────────────────

    public async Task<IEnumerable<Department>> GetAllAsync(Guid tenantId, CancellationToken ct = default)
        => await _db.Departments
            .AsNoTracking()
            .Where(d => d.TenantId == tenantId)
            .Include(d => d.Manager)
            .OrderBy(d => d.Name)
            .ToListAsync(ct);

    public async Task<Department?> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
        => await _db.Departments
            .AsNoTracking()
            .Where(d => d.TenantId == tenantId && d.Id == id)
            .Include(d => d.Manager)
            .Include(d => d.Children)
            .Include(d => d.Positions)
            .FirstOrDefaultAsync(ct);

    public async Task<Department> CreateAsync(Guid tenantId, Department department, CancellationToken ct = default)
    {
        department.Id        = Guid.NewGuid();
        department.TenantId  = tenantId;
        department.IsActive  = true;
        department.CreatedAt = DateTimeOffset.UtcNow;
        department.UpdatedAt = DateTimeOffset.UtcNow;

        _db.Departments.Add(department);
        await _db.SaveChangesAsync(ct);
        _log.LogInformation("Department {DeptId} ({Name}) created in tenant {TenantId}",
            department.Id, department.Name, tenantId);
        return department;
    }

    public async Task<Department> UpdateAsync(Guid tenantId, Department department, CancellationToken ct = default)
    {
        var existing = await _db.Departments
            .FirstOrDefaultAsync(d => d.TenantId == tenantId && d.Id == department.Id, ct)
            ?? throw new KeyNotFoundException($"Department {department.Id} not found.");

        existing.Name        = department.Name;
        existing.Description = department.Description;
        existing.Code        = department.Code;
        existing.ManagerId   = department.ManagerId;
        existing.ParentId    = department.ParentId;
        existing.IsActive    = department.IsActive;
        existing.UpdatedAt   = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);
        return existing;
    }

    public async Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var dept = await _db.Departments
            .FirstOrDefaultAsync(d => d.TenantId == tenantId && d.Id == id, ct)
            ?? throw new KeyNotFoundException($"Department {id} not found.");

        dept.IsActive  = false;
        dept.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    // ── Positions ─────────────────────────────────────────────────────────────

    public async Task<IEnumerable<Position>> GetPositionsAsync(Guid tenantId, Guid? departmentId = null, CancellationToken ct = default)
    {
        var q = _db.Positions
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId)
            .Include(p => p.Department)
            .AsQueryable();

        if (departmentId.HasValue) q = q.Where(p => p.DepartmentId == departmentId.Value);

        return await q.OrderBy(p => p.Title).ToListAsync(ct);
    }

    public async Task<Position?> GetPositionByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
        => await _db.Positions
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId && p.Id == id)
            .Include(p => p.Department)
            .FirstOrDefaultAsync(ct);

    public async Task<Position> CreatePositionAsync(Guid tenantId, Position position, CancellationToken ct = default)
    {
        position.Id        = Guid.NewGuid();
        position.TenantId  = tenantId;
        position.IsActive  = true;
        position.CreatedAt = DateTimeOffset.UtcNow;
        position.UpdatedAt = DateTimeOffset.UtcNow;

        _db.Positions.Add(position);
        await _db.SaveChangesAsync(ct);
        return position;
    }

    public async Task<Position> UpdatePositionAsync(Guid tenantId, Position position, CancellationToken ct = default)
    {
        var existing = await _db.Positions
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == position.Id, ct)
            ?? throw new KeyNotFoundException($"Position {position.Id} not found.");

        existing.Title        = position.Title;
        existing.Description  = position.Description;
        existing.Code         = position.Code;
        existing.DepartmentId = position.DepartmentId;
        existing.MinSalary    = position.MinSalary;
        existing.MaxSalary    = position.MaxSalary;
        existing.IsActive     = position.IsActive;
        existing.UpdatedAt    = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);
        return existing;
    }

    public async Task DeletePositionAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var pos = await _db.Positions
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == id, ct)
            ?? throw new KeyNotFoundException($"Position {id} not found.");

        pos.IsActive  = false;
        pos.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

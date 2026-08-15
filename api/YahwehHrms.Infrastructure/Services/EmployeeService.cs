using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using YahwehHrms.Core.Entities;
using YahwehHrms.Core.Interfaces;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.Infrastructure.Services;

public class EmployeeService : IEmployeeService
{
    private readonly HrmsDbContext _db;
    private readonly ILogger<EmployeeService> _log;

    public EmployeeService(HrmsDbContext db, ILogger<EmployeeService> log)
    {
        _db  = db;
        _log = log;
    }

    public async Task<IEnumerable<Employee>> GetAllAsync(
        Guid tenantId, string? status = null, Guid? departmentId = null,
        Guid? positionId = null, CancellationToken ct = default)
    {
        var q = _db.Employees
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId)
            .Include(e => e.Department)
            .Include(e => e.Position)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(e => e.Status == status);
        if (departmentId.HasValue)              q = q.Where(e => e.DepartmentId == departmentId.Value);
        if (positionId.HasValue)                q = q.Where(e => e.PositionId == positionId.Value);

        return await q.OrderBy(e => e.FirstName).ThenBy(e => e.LastName).ToListAsync(ct);
    }

    public async Task<Employee?> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
        => await _db.Employees
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId && e.Id == id)
            .Include(e => e.Department)
            .Include(e => e.Position)
            .Include(e => e.Manager)
            .Include(e => e.Contracts)
            .FirstOrDefaultAsync(ct);

    public async Task<Employee> CreateAsync(Guid tenantId, Employee employee, CancellationToken ct = default)
    {
        employee.Id        = Guid.NewGuid();
        employee.TenantId  = tenantId;
        employee.CreatedAt = DateTimeOffset.UtcNow;
        employee.UpdatedAt = DateTimeOffset.UtcNow;

        _db.Employees.Add(employee);
        await _db.SaveChangesAsync(ct);

        _log.LogInformation("Employee {EmployeeId} ({Email}) created in tenant {TenantId}",
            employee.Id, employee.Email, tenantId);
        return employee;
    }

    public async Task<Employee> UpdateAsync(Guid tenantId, Employee employee, CancellationToken ct = default)
    {
        var existing = await _db.Employees
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == employee.Id, ct)
            ?? throw new KeyNotFoundException($"Employee {employee.Id} not found.");

        existing.FirstName      = employee.FirstName;
        existing.LastName       = employee.LastName;
        existing.Email          = employee.Email;
        existing.Phone          = employee.Phone;
        existing.Status         = employee.Status;
        existing.DepartmentId   = employee.DepartmentId;
        existing.PositionId     = employee.PositionId;
        existing.ManagerId      = employee.ManagerId;
        existing.EmploymentType = employee.EmploymentType;
        existing.Salary         = employee.Salary;
        existing.AvatarUrl      = employee.AvatarUrl;
        existing.Address        = employee.Address;
        existing.UpdatedAt      = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);
        return existing;
    }

    public async Task TerminateAsync(Guid tenantId, Guid employeeId, DateOnly effectiveDate,
        string reason, CancellationToken ct = default)
    {
        var emp = await _db.Employees
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == employeeId, ct)
            ?? throw new KeyNotFoundException($"Employee {employeeId} not found.");

        emp.Status    = "terminated";
        emp.EndDate   = effectiveDate;
        emp.UpdatedAt = DateTimeOffset.UtcNow;

        _db.SeparationRecords.Add(new SeparationRecord
        {
            Id            = Guid.NewGuid(),
            TenantId      = tenantId,
            EmployeeId    = employeeId,
            Type          = "termination",
            EffectiveDate = effectiveDate,
            Reason        = reason,
            Status        = "in-progress",
            CreatedAt     = DateTimeOffset.UtcNow,
            UpdatedAt     = DateTimeOffset.UtcNow
        });

        await _db.SaveChangesAsync(ct);
        _log.LogInformation("Employee {EmployeeId} terminated in tenant {TenantId}", employeeId, tenantId);
    }

    public async Task<IEnumerable<Employee>> GetDirectReportsAsync(Guid tenantId, Guid managerId, CancellationToken ct = default)
        => await _db.Employees
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId && e.ManagerId == managerId)
            .Include(e => e.Position)
            .OrderBy(e => e.FirstName)
            .ToListAsync(ct);

    public async Task<int> GetHeadcountAsync(Guid tenantId, CancellationToken ct = default)
        => await _db.Employees.CountAsync(e => e.TenantId == tenantId && e.Status != "terminated", ct);
}

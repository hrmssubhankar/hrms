using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.API.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public EmployeesController(HrmsDbContext db) => _db = db;

    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] Guid? departmentId, [FromQuery] Guid? positionId, CancellationToken ct = default)
    {
        var tenantId = TenantId;
        var query = _db.Employees.AsNoTracking().Where(e => e.TenantId == tenantId).Include(e => e.Department).Include(e => e.Position).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(e => e.Status == status);
        if (departmentId.HasValue) query = query.Where(e => e.DepartmentId == departmentId.Value);
        if (positionId.HasValue) query = query.Where(e => e.PositionId == positionId.Value);
        return Ok(await query.OrderBy(e => e.Name).ToListAsync(ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var emp = await _db.Employees.AsNoTracking()
            .Where(e => e.TenantId == TenantId && e.Id == id)
            .Include(e => e.Department).Include(e => e.Position).Include(e => e.Manager).Include(e => e.Contracts)
            .FirstOrDefaultAsync(ct);
        return emp is null ? NotFound() : Ok(emp);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Employee employee, CancellationToken ct = default)
    {
        employee.Id = Guid.NewGuid();
        employee.TenantId = TenantId;
        if (string.IsNullOrWhiteSpace(employee.EmployeeNumber))
            employee.EmployeeNumber = $"EMP-{Random.Shared.Next(100000, 999999)}";
        _db.Employees.Add(employee);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employee);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeRequest req, CancellationToken ct = default)
    {
        var emp = await _db.Employees.FirstOrDefaultAsync(e => e.TenantId == TenantId && e.Id == id, ct);
        if (emp is null) return NotFound();
        if (req.Name is not null) emp.Name = req.Name;
        if (req.Email is not null) emp.Email = req.Email;
        if (req.Phone is not null) emp.Phone = req.Phone;
        if (req.Status is not null) emp.Status = req.Status;
        if (req.DepartmentId.HasValue) emp.DepartmentId = req.DepartmentId.Value;
        if (req.PositionId.HasValue) emp.PositionId = req.PositionId.Value;
        if (req.ManagerId.HasValue) emp.ManagerId = req.ManagerId.Value;
        if (req.EmploymentType is not null) emp.EmploymentType = req.EmploymentType;
        if (req.Salary.HasValue) emp.Salary = req.Salary.Value;
        if (req.AvatarUrl is not null) emp.AvatarUrl = req.AvatarUrl;
        if (req.EndDate.HasValue) emp.EndDate = req.EndDate.Value;
        await _db.SaveChangesAsync(ct);
        return Ok(emp);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var emp = await _db.Employees.FirstOrDefaultAsync(e => e.TenantId == TenantId && e.Id == id, ct);
        if (emp is null) return NotFound();
        emp.Status = "terminated";
        emp.EndDate = DateOnly.FromDateTime(DateTime.UtcNow);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/documents")]
    public async Task<IActionResult> GetDocuments(Guid id, CancellationToken ct = default)
    {
        if (!await _db.Employees.AsNoTracking().AnyAsync(e => e.TenantId == TenantId && e.Id == id, ct)) return NotFound();
        return Ok(await _db.Documents.AsNoTracking().Where(d => d.TenantId == TenantId && d.EmployeeId == id).OrderByDescending(d => d.CreatedAt).ToListAsync(ct));
    }

    [HttpGet("{id:guid}/contracts")]
    public async Task<IActionResult> GetContracts(Guid id, CancellationToken ct = default)
    {
        if (!await _db.Employees.AsNoTracking().AnyAsync(e => e.TenantId == TenantId && e.Id == id, ct)) return NotFound();
        return Ok(await _db.Contracts.AsNoTracking().Where(c => c.TenantId == TenantId && c.EmployeeId == id).OrderByDescending(c => c.StartDate).ToListAsync(ct));
    }

    [HttpGet("{id:guid}/training")]
    public async Task<IActionResult> GetTraining(Guid id, CancellationToken ct = default)
    {
        if (!await _db.Employees.AsNoTracking().AnyAsync(e => e.TenantId == TenantId && e.Id == id, ct)) return NotFound();
        return Ok(await _db.TrainingRecords.AsNoTracking().Where(t => t.TenantId == TenantId && t.EmployeeId == id).Include(t => t.Course).OrderByDescending(t => t.CompletedAt).ToListAsync(ct));
    }

    [HttpGet("{id:guid}/performance")]
    public async Task<IActionResult> GetPerformance(Guid id, CancellationToken ct = default)
    {
        if (!await _db.Employees.AsNoTracking().AnyAsync(e => e.TenantId == TenantId && e.Id == id, ct)) return NotFound();
        return Ok(await _db.PerformanceReviews.AsNoTracking().Where(r => r.TenantId == TenantId && r.EmployeeId == id).OrderByDescending(r => r.ReviewDate).ToListAsync(ct));
    }
}

public sealed class UpdateEmployeeRequest
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Status { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? PositionId { get; set; }
    public Guid? ManagerId { get; set; }
    public string? EmploymentType { get; set; }
    public decimal? Salary { get; set; }
    public string? AvatarUrl { get; set; }
    public DateOnly? EndDate { get; set; }
}

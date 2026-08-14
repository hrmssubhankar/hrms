using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.API.Controllers;

[ApiController]
[Authorize]
[Route("api/departments")]
public class DepartmentsController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public DepartmentsController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default) =>
        Ok(await _db.Departments.AsNoTracking().Where(d => d.TenantId == TenantId).Include(d => d.Manager).ToListAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var d = await _db.Departments.AsNoTracking().Where(d => d.TenantId == TenantId && d.Id == id)
            .Include(d => d.Manager).Include(d => d.Children).Include(d => d.Positions).FirstOrDefaultAsync(ct);
        return d is null ? NotFound() : Ok(d);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest req, CancellationToken ct = default)
    {
        var dept = new Department { Id = Guid.NewGuid(), TenantId = TenantId, Name = req.Name, Description = req.Description, Code = req.Code, ManagerId = req.ManagerId, ParentId = req.ParentId, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = dept.Id }, dept);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDepartmentRequest req, CancellationToken ct = default)
    {
        var dept = await _db.Departments.FirstOrDefaultAsync(d => d.TenantId == TenantId && d.Id == id, ct);
        if (dept is null) return NotFound();
        dept.Name = req.Name; dept.Description = req.Description; dept.Code = req.Code;
        dept.ManagerId = req.ManagerId; dept.ParentId = req.ParentId; dept.IsActive = req.IsActive; dept.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var dept = await _db.Departments.FirstOrDefaultAsync(d => d.TenantId == TenantId && d.Id == id, ct);
        if (dept is null) return NotFound();
        dept.IsActive = false; dept.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record CreateDepartmentRequest(string Name, string? Description, string? Code, Guid? ManagerId, Guid? ParentId);
public record UpdateDepartmentRequest(string Name, string? Description, string? Code, Guid? ManagerId, Guid? ParentId, bool IsActive);

[ApiController]
[Authorize]
[Route("api/positions")]
public class PositionsController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public PositionsController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? departmentId, CancellationToken ct = default)
    {
        var q = _db.Positions.AsNoTracking().Where(p => p.TenantId == TenantId).Include(p => p.Department).AsQueryable();
        if (departmentId.HasValue) q = q.Where(p => p.DepartmentId == departmentId.Value);
        return Ok(await q.ToListAsync(ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var p = await _db.Positions.AsNoTracking().Where(p => p.TenantId == TenantId && p.Id == id).Include(p => p.Department).FirstOrDefaultAsync(ct);
        return p is null ? NotFound() : Ok(p);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePositionRequest req, CancellationToken ct = default)
    {
        var pos = new Position { Id = Guid.NewGuid(), TenantId = TenantId, Title = req.Title, Description = req.Description, Code = req.Code, DepartmentId = req.DepartmentId, MinSalary = req.MinSalary, MaxSalary = req.MaxSalary, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Positions.Add(pos);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = pos.Id }, pos);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePositionRequest req, CancellationToken ct = default)
    {
        var pos = await _db.Positions.FirstOrDefaultAsync(p => p.TenantId == TenantId && p.Id == id, ct);
        if (pos is null) return NotFound();
        pos.Title = req.Title; pos.Description = req.Description; pos.Code = req.Code;
        pos.DepartmentId = req.DepartmentId; pos.MinSalary = req.MinSalary; pos.MaxSalary = req.MaxSalary;
        pos.IsActive = req.IsActive; pos.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var pos = await _db.Positions.FirstOrDefaultAsync(p => p.TenantId == TenantId && p.Id == id, ct);
        if (pos is null) return NotFound();
        pos.IsActive = false; pos.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record CreatePositionRequest(string Title, string? Description, string? Code, Guid DepartmentId, decimal? MinSalary, decimal? MaxSalary);
public record UpdatePositionRequest(string Title, string? Description, string? Code, Guid DepartmentId, decimal? MinSalary, decimal? MaxSalary, bool IsActive);

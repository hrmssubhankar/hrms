using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.API.Controllers;

[ApiController]
[Authorize]
[Route("api/compliance")]
public class ComplianceController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public ComplianceController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? employeeId, [FromQuery] string? status, [FromQuery] string? category, CancellationToken ct = default)
    {
        var q = _db.ComplianceTrackings.AsNoTracking().Where(c => c.TenantId == TenantId).AsQueryable();
        if (employeeId.HasValue) q = q.Where(c => c.EmployeeId == employeeId.Value);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(c => c.Status == status);
        if (!string.IsNullOrWhiteSpace(category)) q = q.Where(c => c.Category == category);
        return Ok(await q.OrderBy(c => c.DueDate).ToListAsync(ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var r = await _db.ComplianceTrackings.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id && c.TenantId == TenantId, ct);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateComplianceRequest req, CancellationToken ct = default)
    {
        var r = new ComplianceTracking { Id = Guid.NewGuid(), TenantId = TenantId, EmployeeId = req.EmployeeId, Requirement = req.Requirement, Category = req.Category, Status = req.Status, DueDate = req.DueDate, CompletedOn = req.CompletedOn, Notes = req.Notes };
        _db.ComplianceTrackings.Add(r);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = r.Id }, r);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateComplianceRequest req, CancellationToken ct = default)
    {
        var r = await _db.ComplianceTrackings.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == TenantId, ct);
        if (r is null) return NotFound();
        r.Requirement = req.Requirement; r.Category = req.Category; r.Status = req.Status; r.DueDate = req.DueDate; r.CompletedOn = req.CompletedOn; r.Notes = req.Notes;
        await _db.SaveChangesAsync(ct);
        return Ok(r);
    }
}

public record CreateComplianceRequest(Guid EmployeeId, string Requirement, string Category, string Status, DateTime? DueDate, DateTime? CompletedOn, string? Notes);

[ApiController]
[Authorize]
[Route("api/onboarding")]
public class OnboardingController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public OnboardingController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? employeeId, [FromQuery] string? stage, [FromQuery] string? status, CancellationToken ct = default)
    {
        var q = _db.OnboardingRecords.AsNoTracking().Where(o => o.TenantId == TenantId).AsQueryable();
        if (employeeId.HasValue) q = q.Where(o => o.EmployeeId == employeeId.Value);
        if (!string.IsNullOrWhiteSpace(stage)) q = q.Where(o => o.Stage == stage);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(o => o.Status == status);
        return Ok(await q.OrderByDescending(o => o.CreatedAt).ToListAsync(ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var r = await _db.OnboardingRecords.AsNoTracking().Include(o => o.Employee).FirstOrDefaultAsync(o => o.Id == id && o.TenantId == TenantId, ct);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOnboardingRequest req, CancellationToken ct = default)
    {
        var r = new OnboardingRecord { Id = Guid.NewGuid(), TenantId = TenantId, EmployeeId = req.EmployeeId, Stage = req.Stage, Status = req.Status, Notes = req.Notes, Checklist = req.Checklist };
        _db.OnboardingRecords.Add(r);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = r.Id }, r);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOnboardingRequest req, CancellationToken ct = default)
    {
        var r = await _db.OnboardingRecords.FirstOrDefaultAsync(o => o.Id == id && o.TenantId == TenantId, ct);
        if (r is null) return NotFound();
        r.Stage = req.Stage; r.Status = req.Status; r.Notes = req.Notes; r.CompletedOn = req.CompletedOn; r.Checklist = req.Checklist; r.AssignedTo = req.AssignedTo;
        await _db.SaveChangesAsync(ct);
        return Ok(r);
    }
}

public record CreateOnboardingRequest(Guid EmployeeId, string Stage, string Status, string? Notes, string? Checklist);
public record UpdateOnboardingRequest(string Stage, string Status, string? Notes, DateTime? CompletedOn, string? Checklist, Guid? AssignedTo);

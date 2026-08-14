using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.API.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class SafetyERController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public SafetyERController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet("whs-incidents")]
    public async Task<IActionResult> GetIncidents([FromQuery] string? severity, CancellationToken ct = default)
    {
        var q = _db.WhsIncidents.AsNoTracking().Where(i => i.TenantId == TenantId).Include(i => i.Employee).AsQueryable();
        if (!string.IsNullOrWhiteSpace(severity)) q = q.Where(i => i.Severity == severity);
        return Ok(await q.OrderByDescending(i => i.OccurredAt).ToListAsync(ct));
    }

    [HttpGet("whs-incidents/{id:guid}")]
    public async Task<IActionResult> GetIncident(Guid id, CancellationToken ct = default)
    {
        var item = await _db.WhsIncidents.AsNoTracking().Include(i => i.Employee).FirstOrDefaultAsync(i => i.TenantId == TenantId && i.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("whs-incidents")]
    public async Task<IActionResult> CreateIncident([FromBody] WhsIncident incident, CancellationToken ct = default)
    {
        incident.Id = Guid.NewGuid(); incident.TenantId = TenantId;
        _db.WhsIncidents.Add(incident); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetIncident), new { id = incident.Id }, incident);
    }

    [HttpPut("whs-incidents/{id:guid}")]
    public async Task<IActionResult> UpdateIncident(Guid id, [FromBody] WhsIncident update, CancellationToken ct = default)
    {
        var item = await _db.WhsIncidents.FirstOrDefaultAsync(i => i.TenantId == TenantId && i.Id == id, ct);
        if (item is null) return NotFound();
        item.Type = update.Type; item.Description = update.Description; item.Severity = update.Severity;
        item.OccurredAt = update.OccurredAt; item.Location = update.Location; item.Status = update.Status;
        item.CorrectiveActions = update.CorrectiveActions; item.ClosedOn = update.ClosedOn;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("whs-incidents/{id:guid}")]
    public async Task<IActionResult> DeleteIncident(Guid id, CancellationToken ct = default)
    {
        var item = await _db.WhsIncidents.FirstOrDefaultAsync(i => i.TenantId == TenantId && i.Id == id, ct);
        if (item is null) return NotFound();
        _db.WhsIncidents.Remove(item); await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("grievances")]
    public async Task<IActionResult> GetGrievances([FromQuery] string? status, CancellationToken ct = default)
    {
        var q = _db.Grievances.AsNoTracking().Where(g => g.TenantId == TenantId).Include(g => g.Employee).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(g => g.Status == status);
        return Ok(await q.OrderByDescending(g => g.CreatedAt).ToListAsync(ct));
    }

    [HttpGet("grievances/{id:guid}")]
    public async Task<IActionResult> GetGrievance(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Grievances.AsNoTracking().Include(g => g.Employee).FirstOrDefaultAsync(g => g.TenantId == TenantId && g.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("grievances")]
    public async Task<IActionResult> CreateGrievance([FromBody] Grievance grievance, CancellationToken ct = default)
    {
        grievance.Id = Guid.NewGuid(); grievance.TenantId = TenantId; grievance.CreatedAt = DateTimeOffset.UtcNow;
        _db.Grievances.Add(grievance); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetGrievance), new { id = grievance.Id }, grievance);
    }

    [HttpPut("grievances/{id:guid}")]
    public async Task<IActionResult> UpdateGrievance(Guid id, [FromBody] Grievance update, CancellationToken ct = default)
    {
        var item = await _db.Grievances.FirstOrDefaultAsync(g => g.TenantId == TenantId && g.Id == id, ct);
        if (item is null) return NotFound();
        item.Category = update.Category; item.Description = update.Description; item.Status = update.Status;
        item.Resolution = update.Resolution; item.ResolvedOn = update.ResolvedOn;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("grievances/{id:guid}")]
    public async Task<IActionResult> DeleteGrievance(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Grievances.FirstOrDefaultAsync(g => g.TenantId == TenantId && g.Id == id, ct);
        if (item is null) return NotFound();
        item.Status = "closed"; await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("separations")]
    public async Task<IActionResult> GetSeparations([FromQuery] Guid? employeeId, CancellationToken ct = default)
    {
        var q = _db.SeparationRecords.AsNoTracking().Where(s => s.TenantId == TenantId).Include(s => s.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(s => s.EmployeeId == employeeId.Value);
        return Ok(await q.OrderByDescending(s => s.EffectiveDate).ToListAsync(ct));
    }

    [HttpGet("separations/{id:guid}")]
    public async Task<IActionResult> GetSeparation(Guid id, CancellationToken ct = default)
    {
        var item = await _db.SeparationRecords.AsNoTracking().Include(s => s.Employee).FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("separations")]
    public async Task<IActionResult> CreateSeparation([FromBody] SeparationRecord separation, CancellationToken ct = default)
    {
        separation.Id = Guid.NewGuid(); separation.TenantId = TenantId;
        _db.SeparationRecords.Add(separation); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetSeparation), new { id = separation.Id }, separation);
    }

    [HttpPut("separations/{id:guid}")]
    public async Task<IActionResult> UpdateSeparation(Guid id, [FromBody] SeparationRecord update, CancellationToken ct = default)
    {
        var item = await _db.SeparationRecords.FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        if (item is null) return NotFound();
        item.Type = update.Type; item.EffectiveDate = update.EffectiveDate;
        item.Reason = update.Reason; item.ExitInterviewDone = update.ExitInterviewDone; item.ExitNotes = update.ExitNotes;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("separations/{id:guid}")]
    public async Task<IActionResult> DeleteSeparation(Guid id, CancellationToken ct = default)
    {
        var item = await _db.SeparationRecords.FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        if (item is null) return NotFound();
        _db.SeparationRecords.Remove(item); await _db.SaveChangesAsync(ct); return NoContent();
    }
}

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
public class CompetenciesSupervisionController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public CompetenciesSupervisionController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet("competencies")]
    public async Task<IActionResult> GetCompetencies(CancellationToken ct = default) =>
        Ok(await _db.Competencies.AsNoTracking().Where(c => c.TenantId == TenantId).OrderBy(c => c.Name).ToListAsync(ct));

    [HttpGet("competencies/{id:guid}")]
    public async Task<IActionResult> GetCompetency(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Competencies.AsNoTracking().FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("competencies")]
    public async Task<IActionResult> CreateCompetency([FromBody] Competency competency, CancellationToken ct = default)
    {
        competency.Id = Guid.NewGuid(); competency.TenantId = TenantId;
        _db.Competencies.Add(competency); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetCompetency), new { id = competency.Id }, competency);
    }

    [HttpPut("competencies/{id:guid}")]
    public async Task<IActionResult> UpdateCompetency(Guid id, [FromBody] Competency update, CancellationToken ct = default)
    {
        var item = await _db.Competencies.FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        if (item is null) return NotFound();
        item.Name = update.Name; item.Description = update.Description; item.Category = update.Category;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("competencies/{id:guid}")]
    public async Task<IActionResult> DeleteCompetency(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Competencies.FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        if (item is null) return NotFound();
        _db.Competencies.Remove(item); await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("competency-assessments")]
    public async Task<IActionResult> GetAssessments([FromQuery] Guid? employeeId, CancellationToken ct = default)
    {
        var q = _db.CompetencyAssessments.AsNoTracking().Where(a => a.TenantId == TenantId).Include(a => a.Competency).Include(a => a.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(a => a.EmployeeId == employeeId.Value);
        return Ok(await q.OrderByDescending(a => a.AssessedOn).ToListAsync(ct));
    }

    [HttpGet("competency-assessments/{id:guid}")]
    public async Task<IActionResult> GetAssessment(Guid id, CancellationToken ct = default)
    {
        var item = await _db.CompetencyAssessments.AsNoTracking().Include(a => a.Competency).Include(a => a.Employee).FirstOrDefaultAsync(a => a.TenantId == TenantId && a.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("competency-assessments")]
    public async Task<IActionResult> CreateAssessment([FromBody] CompetencyAssessment assessment, CancellationToken ct = default)
    {
        assessment.Id = Guid.NewGuid(); assessment.TenantId = TenantId;
        _db.CompetencyAssessments.Add(assessment); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetAssessment), new { id = assessment.Id }, assessment);
    }

    [HttpPut("competency-assessments/{id:guid}")]
    public async Task<IActionResult> UpdateAssessment(Guid id, [FromBody] CompetencyAssessment update, CancellationToken ct = default)
    {
        var item = await _db.CompetencyAssessments.FirstOrDefaultAsync(a => a.TenantId == TenantId && a.Id == id, ct);
        if (item is null) return NotFound();
        item.Level = update.Level; item.Notes = update.Notes; item.AssessedOn = update.AssessedOn; item.AssessedBy = update.AssessedBy;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("competency-assessments/{id:guid}")]
    public async Task<IActionResult> DeleteAssessment(Guid id, CancellationToken ct = default)
    {
        var item = await _db.CompetencyAssessments.FirstOrDefaultAsync(a => a.TenantId == TenantId && a.Id == id, ct);
        if (item is null) return NotFound();
        _db.CompetencyAssessments.Remove(item); await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("supervision-records")]
    public async Task<IActionResult> GetSupervision([FromQuery] Guid? employeeId, CancellationToken ct = default)
    {
        var q = _db.SupervisionRecords.AsNoTracking().Where(s => s.TenantId == TenantId).Include(s => s.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(s => s.EmployeeId == employeeId.Value);
        return Ok(await q.OrderByDescending(s => s.SessionDate).ToListAsync(ct));
    }

    [HttpGet("supervision-records/{id:guid}")]
    public async Task<IActionResult> GetSupervisionById(Guid id, CancellationToken ct = default)
    {
        var item = await _db.SupervisionRecords.AsNoTracking().Include(s => s.Employee).FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("supervision-records")]
    public async Task<IActionResult> CreateSupervision([FromBody] SupervisionRecord record, CancellationToken ct = default)
    {
        record.Id = Guid.NewGuid(); record.TenantId = TenantId;
        _db.SupervisionRecords.Add(record); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetSupervisionById), new { id = record.Id }, record);
    }

    [HttpPut("supervision-records/{id:guid}")]
    public async Task<IActionResult> UpdateSupervision(Guid id, [FromBody] SupervisionRecord update, CancellationToken ct = default)
    {
        var item = await _db.SupervisionRecords.FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        if (item is null) return NotFound();
        item.SessionDate = update.SessionDate; item.SupervisorId = update.SupervisorId;
        item.Notes = update.Notes; item.ActionItems = update.ActionItems; item.IsCompleted = update.IsCompleted;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("supervision-records/{id:guid}")]
    public async Task<IActionResult> DeleteSupervision(Guid id, CancellationToken ct = default)
    {
        var item = await _db.SupervisionRecords.FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        if (item is null) return NotFound();
        _db.SupervisionRecords.Remove(item); await _db.SaveChangesAsync(ct); return NoContent();
    }
}

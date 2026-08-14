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
public class RecruitmentController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public RecruitmentController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet("job-requisitions")]
    public async Task<IActionResult> GetRequisitions([FromQuery] string? status, CancellationToken ct = default)
    {
        var q = _db.JobRequisitions.AsNoTracking().Where(r => r.TenantId == TenantId).Include(r => r.Department).Include(r => r.Position).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(r => r.Status == status);
        return Ok(await q.OrderByDescending(r => r.CreatedAt).ToListAsync(ct));
    }

    [HttpGet("job-requisitions/{id:guid}")]
    public async Task<IActionResult> GetRequisition(Guid id, CancellationToken ct = default)
    {
        var item = await _db.JobRequisitions.AsNoTracking().Include(r => r.Department).Include(r => r.Position).Include(r => r.Applications).FirstOrDefaultAsync(r => r.TenantId == TenantId && r.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("job-requisitions")]
    public async Task<IActionResult> CreateRequisition([FromBody] JobRequisition req, CancellationToken ct = default)
    {
        req.Id = Guid.NewGuid(); req.TenantId = TenantId; req.CreatedAt = DateTime.UtcNow;
        _db.JobRequisitions.Add(req); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetRequisition), new { id = req.Id }, req);
    }

    [HttpPut("job-requisitions/{id:guid}")]
    public async Task<IActionResult> UpdateRequisition(Guid id, [FromBody] JobRequisition update, CancellationToken ct = default)
    {
        var item = await _db.JobRequisitions.FirstOrDefaultAsync(r => r.TenantId == TenantId && r.Id == id, ct);
        if (item is null) return NotFound();
        item.Title = update.Title; item.Description = update.Description; item.Status = update.Status;
        item.DepartmentId = update.DepartmentId; item.PositionId = update.PositionId; item.CloseDate = update.CloseDate; item.Headcount = update.Headcount;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("job-requisitions/{id:guid}")]
    public async Task<IActionResult> DeleteRequisition(Guid id, CancellationToken ct = default)
    {
        var item = await _db.JobRequisitions.FirstOrDefaultAsync(r => r.TenantId == TenantId && r.Id == id, ct);
        if (item is null) return NotFound();
        item.Status = "closed"; await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("candidates")]
    public async Task<IActionResult> GetCandidates([FromQuery] string? status, CancellationToken ct = default)
    {
        var q = _db.Candidates.AsNoTracking().Where(c => c.TenantId == TenantId).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(c => c.Status == status);
        return Ok(await q.OrderByDescending(c => c.CreatedAt).ToListAsync(ct));
    }

    [HttpGet("candidates/{id:guid}")]
    public async Task<IActionResult> GetCandidate(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Candidates.AsNoTracking().Include(c => c.Applications).FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("candidates")]
    public async Task<IActionResult> CreateCandidate([FromBody] Candidate candidate, CancellationToken ct = default)
    {
        candidate.Id = Guid.NewGuid(); candidate.TenantId = TenantId; candidate.CreatedAt = DateTime.UtcNow;
        _db.Candidates.Add(candidate); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetCandidate), new { id = candidate.Id }, candidate);
    }

    [HttpPut("candidates/{id:guid}")]
    public async Task<IActionResult> UpdateCandidate(Guid id, [FromBody] Candidate update, CancellationToken ct = default)
    {
        var item = await _db.Candidates.FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        if (item is null) return NotFound();
        item.FirstName = update.FirstName; item.LastName = update.LastName; item.Email = update.Email;
        item.Phone = update.Phone; item.Status = update.Status; item.ResumeUrl = update.ResumeUrl; item.Notes = update.Notes;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("candidates/{id:guid}")]
    public async Task<IActionResult> DeleteCandidate(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Candidates.FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        if (item is null) return NotFound();
        _db.Candidates.Remove(item); await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetApplications([FromQuery] Guid? requisitionId, [FromQuery] string? status, CancellationToken ct = default)
    {
        var q = _db.Applications.AsNoTracking().Where(a => a.TenantId == TenantId).Include(a => a.Candidate).Include(a => a.JobRequisition).AsQueryable();
        if (requisitionId.HasValue) q = q.Where(a => a.JobRequisitionId == requisitionId.Value);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(a => a.Status == status);
        return Ok(await q.OrderByDescending(a => a.AppliedAt).ToListAsync(ct));
    }

    [HttpGet("applications/{id:guid}")]
    public async Task<IActionResult> GetApplication(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Applications.AsNoTracking().Include(a => a.Candidate).Include(a => a.JobRequisition).FirstOrDefaultAsync(a => a.TenantId == TenantId && a.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("applications")]
    public async Task<IActionResult> CreateApplication([FromBody] Application application, CancellationToken ct = default)
    {
        application.Id = Guid.NewGuid(); application.TenantId = TenantId; application.AppliedAt = DateTime.UtcNow;
        _db.Applications.Add(application); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetApplication), new { id = application.Id }, application);
    }

    [HttpPut("applications/{id:guid}")]
    public async Task<IActionResult> UpdateApplication(Guid id, [FromBody] Application update, CancellationToken ct = default)
    {
        var item = await _db.Applications.FirstOrDefaultAsync(a => a.TenantId == TenantId && a.Id == id, ct);
        if (item is null) return NotFound();
        item.Status = update.Status; item.Stage = update.Stage; item.Notes = update.Notes; item.InterviewDate = update.InterviewDate;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("applications/{id:guid}")]
    public async Task<IActionResult> DeleteApplication(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Applications.FirstOrDefaultAsync(a => a.TenantId == TenantId && a.Id == id, ct);
        if (item is null) return NotFound();
        item.Status = "withdrawn"; await _db.SaveChangesAsync(ct); return NoContent();
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.API.Controllers;

[ApiController]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public DocumentsController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet("api/documents")]
    public async Task<IActionResult> List([FromQuery] Guid? employeeId, [FromQuery] string? category, CancellationToken ct = default)
    {
        var q = _db.Documents.AsNoTracking().Where(d => d.TenantId == TenantId).AsQueryable();
        if (employeeId.HasValue) q = q.Where(d => d.EmployeeId == employeeId.Value);
        if (!string.IsNullOrWhiteSpace(category)) q = q.Where(d => d.Category == category);
        return Ok(await q.OrderByDescending(d => d.CreatedAt).ToListAsync(ct));
    }

    [HttpGet("api/documents/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var doc = await _db.Documents.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId, ct);
        return doc is null ? NotFound() : Ok(doc);
    }

    [HttpPost("api/documents")]
    public async Task<IActionResult> Create([FromBody] CreateDocumentRequest req, CancellationToken ct = default)
    {
        var doc = new Document { Id = Guid.NewGuid(), TenantId = TenantId, EmployeeId = req.EmployeeId, Name = req.Name, Category = req.Category, StorageUrl = req.StorageUrl, ContentType = req.ContentType, SizeBytes = req.SizeBytes, ExpiresOn = req.ExpiresOn, IsConfidential = req.IsConfidential, CreatedAt = DateTime.UtcNow };
        _db.Documents.Add(doc);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = doc.Id }, doc);
    }

    [HttpPut("api/documents/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDocumentRequest req, CancellationToken ct = default)
    {
        var doc = await _db.Documents.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId, ct);
        if (doc is null) return NotFound();
        doc.Name = req.Name; doc.Category = req.Category; doc.ExpiresOn = req.ExpiresOn; doc.IsConfidential = req.IsConfidential;
        await _db.SaveChangesAsync(ct);
        return Ok(doc);
    }

    [HttpDelete("api/documents/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var doc = await _db.Documents.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId, ct);
        if (doc is null) return NotFound();
        _db.Documents.Remove(doc);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public sealed record CreateDocumentRequest(string Name, string Category, string StorageUrl, string ContentType, long SizeBytes, Guid EmployeeId, DateTime? ExpiresOn, bool IsConfidential);
public sealed record UpdateDocumentRequest(string Name, string Category, DateTime? ExpiresOn, bool IsConfidential);

[ApiController]
[Authorize]
public class ScreeningController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public ScreeningController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet("api/screening")]
    public async Task<IActionResult> List([FromQuery] Guid? employeeId, [FromQuery] string? status, CancellationToken ct = default)
    {
        var q = _db.ScreeningRecords.AsNoTracking().Where(s => s.TenantId == TenantId).AsQueryable();
        if (employeeId.HasValue) q = q.Where(s => s.EmployeeId == employeeId.Value);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(s => s.Status == status);
        return Ok(await q.OrderByDescending(s => s.CreatedAt).ToListAsync(ct));
    }

    [HttpGet("api/screening/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var r = await _db.ScreeningRecords.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id && s.TenantId == TenantId, ct);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpPost("api/screening")]
    public async Task<IActionResult> Create([FromBody] CreateScreeningRequest req, CancellationToken ct = default)
    {
        var r = new ScreeningRecord { Id = Guid.NewGuid(), TenantId = TenantId, EmployeeId = req.EmployeeId, Type = req.Type, Status = req.Status, CompletedOn = req.CompletedOn, ExpiresOn = req.ExpiresOn, Notes = req.Notes, DocumentUrl = req.DocumentUrl, VerifiedBy = req.VerifiedBy, CreatedAt = DateTime.UtcNow };
        _db.ScreeningRecords.Add(r);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = r.Id }, r);
    }

    [HttpPut("api/screening/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateScreeningRequest req, CancellationToken ct = default)
    {
        var r = await _db.ScreeningRecords.FirstOrDefaultAsync(s => s.Id == id && s.TenantId == TenantId, ct);
        if (r is null) return NotFound();
        r.Type = req.Type; r.Status = req.Status; r.CompletedOn = req.CompletedOn; r.ExpiresOn = req.ExpiresOn; r.Notes = req.Notes; r.DocumentUrl = req.DocumentUrl; r.VerifiedBy = req.VerifiedBy;
        await _db.SaveChangesAsync(ct);
        return Ok(r);
    }

    [HttpDelete("api/screening/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var r = await _db.ScreeningRecords.FirstOrDefaultAsync(s => s.Id == id && s.TenantId == TenantId, ct);
        if (r is null) return NotFound();
        _db.ScreeningRecords.Remove(r);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public sealed record CreateScreeningRequest(Guid EmployeeId, string Type, string Status, DateTime? CompletedOn, DateTime? ExpiresOn, string? Notes, string? DocumentUrl, string? VerifiedBy);

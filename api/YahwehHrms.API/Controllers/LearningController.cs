using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.API.Controllers;

[ApiController]
[Route("api/courses")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public CoursesController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? category, [FromQuery] bool? isActive, CancellationToken ct = default)
    {
        var q = _db.Courses.AsNoTracking().Where(c => c.TenantId == TenantId).AsQueryable();
        if (!string.IsNullOrWhiteSpace(category)) q = q.Where(c => c.Category == category);
        if (isActive.HasValue) q = q.Where(c => c.IsActive == isActive.Value);
        return Ok(await q.OrderBy(c => c.Title).ToListAsync(ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var c = await _db.Courses.AsNoTracking().Where(c => c.TenantId == TenantId && c.Id == id).FirstOrDefaultAsync(ct);
        return c is null ? NotFound() : Ok(c);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCourseRequest req, CancellationToken ct = default)
    {
        var course = new Course
        {
            Id = Guid.NewGuid(), TenantId = TenantId, Title = req.Title, Description = req.Description,
            Category = req.Category ?? "general", Provider = req.Provider, DurationMins = req.DurationMins,
            IsMandatory = req.IsMandatory, ContentUrl = req.ContentUrl, IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        _db.Courses.Add(course);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCourseRequest req, CancellationToken ct = default)
    {
        var c = await _db.Courses.FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        if (c is null) return NotFound();
        c.Title = req.Title; c.Description = req.Description; c.Category = req.Category ?? c.Category;
        c.Provider = req.Provider; c.DurationMins = req.DurationMins; c.IsMandatory = req.IsMandatory;
        c.ContentUrl = req.ContentUrl; c.IsActive = req.IsActive; c.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var c = await _db.Courses.FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        if (c is null) return NotFound();
        c.IsActive = false; c.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record CreateCourseRequest(string Title, string? Description, string? Category, string? Provider, int? DurationMins, bool IsMandatory, string? ContentUrl);
public record UpdateCourseRequest(string Title, string? Description, string? Category, string? Provider, int? DurationMins, bool IsMandatory, string? ContentUrl, bool IsActive);

[ApiController]
[Route("api/training")]
[Authorize]
public class TrainingController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public TrainingController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? employeeId, [FromQuery] Guid? courseId, [FromQuery] string? status, CancellationToken ct = default)
    {
        var q = _db.TrainingRecords.AsNoTracking().Where(t => t.TenantId == TenantId).Include(t => t.Course).AsQueryable();
        if (employeeId.HasValue) q = q.Where(t => t.EmployeeId == employeeId.Value);
        if (courseId.HasValue) q = q.Where(t => t.CourseId == courseId.Value);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(t => t.Status == status);
        return Ok(await q.OrderByDescending(t => t.StartedOn).ToListAsync(ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct = default)
    {
        var r = await _db.TrainingRecords.AsNoTracking().Include(t => t.Employee).Include(t => t.Course).Where(t => t.TenantId == TenantId && t.Id == id).FirstOrDefaultAsync(ct);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTrainingRecordRequest req, CancellationToken ct = default)
    {
        var r = new TrainingRecord
        {
            Id = Guid.NewGuid(), TenantId = TenantId, EmployeeId = req.EmployeeId,
            CourseId = req.CourseId, Status = req.Status, StartedOn = req.StartedOn,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        _db.TrainingRecords.Add(r);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = r.Id }, r);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTrainingRecordRequest req, CancellationToken ct = default)
    {
        var r = await _db.TrainingRecords.FirstOrDefaultAsync(t => t.TenantId == TenantId && t.Id == id, ct);
        if (r is null) return NotFound();
        r.Status = req.Status; r.ScorePercent = req.ScorePercent; r.StartedOn = req.StartedOn;
        r.CompletedOn = req.CompletedOn; r.ExpiresOn = req.ExpiresOn; r.CertificateUrl = req.CertificateUrl;
        r.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record CreateTrainingRecordRequest(Guid EmployeeId, Guid CourseId, string Status, DateOnly? StartedOn);
public record UpdateTrainingRecordRequest(string Status, int? ScorePercent, DateOnly? StartedOn, DateOnly? CompletedOn, DateOnly? ExpiresOn, string? CertificateUrl);

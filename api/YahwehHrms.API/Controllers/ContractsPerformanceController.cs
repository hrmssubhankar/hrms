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
public class ContractsPerformanceController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public ContractsPerformanceController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet("contracts")]
    public async Task<IActionResult> GetContracts([FromQuery] Guid? employeeId, [FromQuery] string? status, CancellationToken ct = default)
    {
        var q = _db.Contracts.AsNoTracking().Where(c => c.TenantId == TenantId).Include(c => c.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(c => c.EmployeeId == employeeId.Value);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(c => c.Status == status);
        return Ok(await q.OrderByDescending(c => c.StartDate).ToListAsync(ct));
    }

    [HttpGet("contracts/{id:guid}")]
    public async Task<IActionResult> GetContract(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Contracts.AsNoTracking().Include(c => c.Employee).FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("contracts")]
    public async Task<IActionResult> CreateContract([FromBody] Contract contract, CancellationToken ct = default)
    {
        contract.Id = Guid.NewGuid(); contract.TenantId = TenantId;
        _db.Contracts.Add(contract); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetContract), new { id = contract.Id }, contract);
    }

    [HttpPut("contracts/{id:guid}")]
    public async Task<IActionResult> UpdateContract(Guid id, [FromBody] Contract update, CancellationToken ct = default)
    {
        var item = await _db.Contracts.FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        if (item is null) return NotFound();
        item.Type = update.Type; item.StartDate = update.StartDate; item.EndDate = update.EndDate;
        item.Status = update.Status; item.Salary = update.Salary; item.PayFrequency = update.PayFrequency;
        item.DocumentUrl = update.DocumentUrl; item.IsSigned = update.IsSigned;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("contracts/{id:guid}")]
    public async Task<IActionResult> DeleteContract(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Contracts.FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Id == id, ct);
        if (item is null) return NotFound();
        item.Status = "terminated"; await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("performance-reviews")]
    public async Task<IActionResult> GetReviews([FromQuery] Guid? employeeId, CancellationToken ct = default)
    {
        var q = _db.PerformanceReviews.AsNoTracking().Where(r => r.TenantId == TenantId).Include(r => r.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(r => r.EmployeeId == employeeId.Value);
        return Ok(await q.OrderByDescending(r => r.DueDate).ToListAsync(ct));
    }

    [HttpGet("performance-reviews/{id:guid}")]
    public async Task<IActionResult> GetReview(Guid id, CancellationToken ct = default)
    {
        var item = await _db.PerformanceReviews.AsNoTracking().Include(r => r.Employee).FirstOrDefaultAsync(r => r.TenantId == TenantId && r.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("performance-reviews")]
    public async Task<IActionResult> CreateReview([FromBody] PerformanceReview review, CancellationToken ct = default)
    {
        review.Id = Guid.NewGuid(); review.TenantId = TenantId;
        _db.PerformanceReviews.Add(review); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetReview), new { id = review.Id }, review);
    }

    [HttpPut("performance-reviews/{id:guid}")]
    public async Task<IActionResult> UpdateReview(Guid id, [FromBody] PerformanceReview update, CancellationToken ct = default)
    {
        var item = await _db.PerformanceReviews.FirstOrDefaultAsync(r => r.TenantId == TenantId && r.Id == id, ct);
        if (item is null) return NotFound();
        item.Type = update.Type; item.DueDate = update.DueDate; item.ReviewerId = update.ReviewerId;
        item.OverallScore = update.OverallScore; item.ManagerNotes = update.ManagerNotes;
        item.Goals = update.Goals; item.Status = update.Status; item.CompletedOn = update.CompletedOn;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("performance-reviews/{id:guid}")]
    public async Task<IActionResult> DeleteReview(Guid id, CancellationToken ct = default)
    {
        var item = await _db.PerformanceReviews.FirstOrDefaultAsync(r => r.TenantId == TenantId && r.Id == id, ct);
        if (item is null) return NotFound();
        _db.PerformanceReviews.Remove(item); await _db.SaveChangesAsync(ct); return NoContent();
    }
}

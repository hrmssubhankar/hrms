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
public class OperationsController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public OperationsController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet("assets")]
    public async Task<IActionResult> GetAssets([FromQuery] string? status, CancellationToken ct = default)
    {
        var q = _db.Assets.AsNoTracking().Where(a => a.TenantId == TenantId).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(a => a.Status == status);
        return Ok(await q.OrderBy(a => a.Name).ToListAsync(ct));
    }

    [HttpGet("assets/{id:guid}")]
    public async Task<IActionResult> GetAsset(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Assets.AsNoTracking().Include(a => a.AssetAssignments).ThenInclude(aa => aa.Employee).FirstOrDefaultAsync(a => a.TenantId == TenantId && a.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("assets")]
    public async Task<IActionResult> CreateAsset([FromBody] Asset asset, CancellationToken ct = default)
    {
        asset.Id = Guid.NewGuid(); asset.TenantId = TenantId;
        _db.Assets.Add(asset); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
    }

    [HttpPut("assets/{id:guid}")]
    public async Task<IActionResult> UpdateAsset(Guid id, [FromBody] Asset update, CancellationToken ct = default)
    {
        var item = await _db.Assets.FirstOrDefaultAsync(a => a.TenantId == TenantId && a.Id == id, ct);
        if (item is null) return NotFound();
        item.Name = update.Name; item.Category = update.Category; item.SerialNumber = update.SerialNumber;
        item.Status = update.Status; item.PurchaseDate = update.PurchaseDate; item.PurchaseCost = update.PurchaseCost; item.Notes = update.Notes;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("assets/{id:guid}")]
    public async Task<IActionResult> DeleteAsset(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Assets.FirstOrDefaultAsync(a => a.TenantId == TenantId && a.Id == id, ct);
        if (item is null) return NotFound();
        item.Status = "disposed"; await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpPost("assets/{id:guid}/assign")]
    public async Task<IActionResult> AssignAsset(Guid id, [FromBody] AssetAssignment assignment, CancellationToken ct = default)
    {
        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.TenantId == TenantId && a.Id == id, ct);
        if (asset is null) return NotFound();
        assignment.Id = Guid.NewGuid(); assignment.AssetId = id; assignment.TenantId = TenantId; assignment.AssignedAt = DateTime.UtcNow;
        asset.Status = "assigned";
        _db.AssetAssignments.Add(assignment); await _db.SaveChangesAsync(ct);
        return Ok(assignment);
    }

    [HttpGet("shifts")]
    public async Task<IActionResult> GetShifts([FromQuery] Guid? employeeId, CancellationToken ct = default)
    {
        var q = _db.Shifts.AsNoTracking().Where(s => s.TenantId == TenantId).Include(s => s.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(s => s.EmployeeId == employeeId.Value);
        return Ok(await q.OrderByDescending(s => s.StartTime).ToListAsync(ct));
    }

    [HttpGet("shifts/{id:guid}")]
    public async Task<IActionResult> GetShift(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Shifts.AsNoTracking().Include(s => s.Employee).FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("shifts")]
    public async Task<IActionResult> CreateShift([FromBody] Shift shift, CancellationToken ct = default)
    {
        shift.Id = Guid.NewGuid(); shift.TenantId = TenantId;
        _db.Shifts.Add(shift); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetShift), new { id = shift.Id }, shift);
    }

    [HttpPut("shifts/{id:guid}")]
    public async Task<IActionResult> UpdateShift(Guid id, [FromBody] Shift update, CancellationToken ct = default)
    {
        var item = await _db.Shifts.FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        if (item is null) return NotFound();
        item.StartTime = update.StartTime; item.EndTime = update.EndTime; item.ShiftType = update.ShiftType; item.Notes = update.Notes;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("shifts/{id:guid}")]
    public async Task<IActionResult> DeleteShift(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Shifts.FirstOrDefaultAsync(s => s.TenantId == TenantId && s.Id == id, ct);
        if (item is null) return NotFound();
        _db.Shifts.Remove(item); await _db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("timesheets")]
    public async Task<IActionResult> GetTimesheets([FromQuery] Guid? employeeId, [FromQuery] string? status, CancellationToken ct = default)
    {
        var q = _db.Timesheets.AsNoTracking().Where(t => t.TenantId == TenantId).Include(t => t.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(t => t.EmployeeId == employeeId.Value);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(t => t.Status == status);
        return Ok(await q.OrderByDescending(t => t.PeriodStart).ToListAsync(ct));
    }

    [HttpGet("timesheets/{id:guid}")]
    public async Task<IActionResult> GetTimesheet(Guid id, CancellationToken ct = default)
    {
        var item = await _db.Timesheets.AsNoTracking().Include(t => t.Employee).FirstOrDefaultAsync(t => t.TenantId == TenantId && t.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("timesheets")]
    public async Task<IActionResult> CreateTimesheet([FromBody] Timesheet timesheet, CancellationToken ct = default)
    {
        timesheet.Id = Guid.NewGuid(); timesheet.TenantId = TenantId;
        _db.Timesheets.Add(timesheet); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetTimesheet), new { id = timesheet.Id }, timesheet);
    }

    [HttpPut("timesheets/{id:guid}")]
    public async Task<IActionResult> UpdateTimesheet(Guid id, [FromBody] Timesheet update, CancellationToken ct = default)
    {
        var item = await _db.Timesheets.FirstOrDefaultAsync(t => t.TenantId == TenantId && t.Id == id, ct);
        if (item is null) return NotFound();
        item.TotalHours = update.TotalHours; item.OvertimeHours = update.OvertimeHours;
        item.Status = update.Status; item.ApprovedBy = update.ApprovedBy; item.ApprovedAt = update.ApprovedAt; item.Notes = update.Notes;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpGet("payroll")]
    public async Task<IActionResult> GetPayroll([FromQuery] Guid? employeeId, CancellationToken ct = default)
    {
        var q = _db.PayrollRecords.AsNoTracking().Where(p => p.TenantId == TenantId).Include(p => p.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(p => p.EmployeeId == employeeId.Value);
        return Ok(await q.OrderByDescending(p => p.PayDate).ToListAsync(ct));
    }

    [HttpGet("payroll/{id:guid}")]
    public async Task<IActionResult> GetPayrollRecord(Guid id, CancellationToken ct = default)
    {
        var item = await _db.PayrollRecords.AsNoTracking().Include(p => p.Employee).FirstOrDefaultAsync(p => p.TenantId == TenantId && p.Id == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("payroll")]
    public async Task<IActionResult> CreatePayrollRecord([FromBody] PayrollRecord record, CancellationToken ct = default)
    {
        record.Id = Guid.NewGuid(); record.TenantId = TenantId;
        _db.PayrollRecords.Add(record); await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetPayrollRecord), new { id = record.Id }, record);
    }

    [HttpPut("payroll/{id:guid}")]
    public async Task<IActionResult> UpdatePayrollRecord(Guid id, [FromBody] PayrollRecord update, CancellationToken ct = default)
    {
        var item = await _db.PayrollRecords.FirstOrDefaultAsync(p => p.TenantId == TenantId && p.Id == id, ct);
        if (item is null) return NotFound();
        item.GrossPay = update.GrossPay; item.NetPay = update.NetPay; item.TaxWithheld = update.TaxWithheld;
        item.Superannuation = update.Superannuation; item.Deductions = update.Deductions; item.Status = update.Status;
        await _db.SaveChangesAsync(ct); return Ok(item);
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly HrmsDbContext _db;
    public DashboardController(HrmsDbContext db) => _db = db;
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("tenant_id"), out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct = default)
    {
        var tenantId = TenantId;
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        Guid.TryParse(sub, out var userId);

        var results = await Task.WhenAll(
            _db.Employees.CountAsync(e => e.TenantId == tenantId && e.Status != "terminated", ct),
            _db.Contracts.CountAsync(c => c.TenantId == tenantId && c.Status == "active", ct),
            _db.JobRequisitions.CountAsync(r => r.TenantId == tenantId && r.Status == "open", ct),
            _db.WhsIncidents.CountAsync(i => i.TenantId == tenantId && i.Status != "closed", ct),
            _db.Grievances.CountAsync(g => g.TenantId == tenantId && g.Status == "open", ct),
            _db.Timesheets.CountAsync(t => t.TenantId == tenantId && t.Status == "pending", ct),
            _db.Applications.CountAsync(a => a.TenantId == tenantId && a.Status == "applied", ct),
            _db.Notifications.CountAsync(n => n.TenantId == tenantId && n.UserId == userId && !n.IsRead, ct)
        );

        return Ok(new
        {
            totalActiveEmployees  = results[0],
            activeContracts       = results[1],
            openJobRequisitions   = results[2],
            openWhsIncidents      = results[3],
            openGrievances        = results[4],
            pendingTimesheets     = results[5],
            newApplications       = results[6],
            unreadNotifications   = results[7],
            generatedAt           = DateTimeOffset.UtcNow
        });
    }

    [HttpGet("recent-activity")]
    public async Task<IActionResult> GetRecentActivity(CancellationToken ct = default)
    {
        var tenantId = TenantId;

        var recentHires = await _db.Employees.AsNoTracking()
            .Where(e => e.TenantId == tenantId).OrderByDescending(e => e.StartDate).Take(5)
            .Select(e => new { type = "new_hire", e.Id, name = e.FirstName + " " + e.LastName, e.StartDate }).ToListAsync(ct);

        var recentIncidents = await _db.WhsIncidents.AsNoTracking()
            .Where(i => i.TenantId == tenantId).OrderByDescending(i => i.OccurredAt).Take(5)
            .Select(i => new { type = "whs_incident", i.Id, incidentType = i.Type, i.OccurredAt }).ToListAsync(ct);

        var recentApplications = await _db.Applications.AsNoTracking()
            .Where(a => a.TenantId == tenantId).OrderByDescending(a => a.CreatedAt).Include(a => a.Candidate).Take(5)
            .Select(a => new { type = "application", a.Id, candidateName = a.Candidate != null ? a.Candidate.FirstName + " " + a.Candidate.LastName : "Unknown", a.CreatedAt }).ToListAsync(ct);

        var auditLogs = await _db.AuditLogs.AsNoTracking()
            .Where(l => l.TenantId == tenantId).OrderByDescending(l => l.Timestamp).Take(10).ToListAsync(ct);

        return Ok(new { recentHires, recentIncidents, recentApplications, auditLogs });
    }
}

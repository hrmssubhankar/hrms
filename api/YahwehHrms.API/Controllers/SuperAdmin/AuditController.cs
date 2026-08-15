using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.Api.Controllers.SuperAdmin;

/// <summary>
/// Super Admin — Immutable audit event log.
/// Base route: /api/superadmin/audit
/// </summary>
[ApiController]
[Route("api/superadmin/audit")]
[Authorize(Roles = "SuperAdmin")]
[Produces("application/json")]
public sealed class AuditController : ControllerBase
{
    private readonly HrmsDbContext _db;

    public AuditController(HrmsDbContext db) => _db = db;

    /// <summary>
    /// Returns paginated super_admin_events with optional filters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetEvents(
        [FromQuery] string?  action     = null,
        [FromQuery] string?  entityType = null,
        [FromQuery] Guid?    adminId    = null,
        [FromQuery] Guid?    entityId   = null,
        [FromQuery] DateTimeOffset? from = null,
        [FromQuery] DateTimeOffset? to   = null,
        [FromQuery] int page    = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 1, 200);
        page     = Math.Max(1, page);

        var q = _db.SuperAdminEvents
            .AsNoTracking()
            .Include(e => e.SuperAdmin)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(action))     q = q.Where(e => e.Action == action);
        if (!string.IsNullOrWhiteSpace(entityType)) q = q.Where(e => e.EntityType == entityType);
        if (adminId.HasValue)                        q = q.Where(e => e.SuperAdminId == adminId.Value);
        if (entityId.HasValue)                       q = q.Where(e => e.EntityId == entityId.Value);
        if (from.HasValue)                           q = q.Where(e => e.CreatedAt >= from.Value);
        if (to.HasValue)                             q = q.Where(e => e.CreatedAt <= to.Value);

        var total = await q.CountAsync(ct);

        var events = await q
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new
            {
                e.Id,
                e.Action,
                e.EntityType,
                e.EntityId,
                e.OldValue,
                e.NewValue,
                e.IpAddress,
                e.CreatedAt,
                Admin = e.SuperAdmin == null ? null : new
                {
                    e.SuperAdmin.Id,
                    e.SuperAdmin.Email,
                    e.SuperAdmin.DisplayName
                }
            })
            .ToListAsync(ct);

        return Ok(new
        {
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)total / pageSize),
            items = events
        });
    }

    /// <summary>
    /// Returns all audit events for a specific entity (e.g. a tenant).
    /// </summary>
    [HttpGet("entity/{entityType}/{entityId:guid}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetForEntity(
        string entityType, Guid entityId, CancellationToken ct)
    {
        var events = await _db.SuperAdminEvents
            .AsNoTracking()
            .Where(e => e.EntityType == entityType && e.EntityId == entityId)
            .Include(e => e.SuperAdmin)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new
            {
                e.Id,
                e.Action,
                e.OldValue,
                e.NewValue,
                e.CreatedAt,
                Admin = e.SuperAdmin == null ? null : new
                {
                    e.SuperAdmin.Id,
                    e.SuperAdmin.Email,
                    e.SuperAdmin.DisplayName
                }
            })
            .ToListAsync(ct);

        return Ok(events);
    }

    /// <summary>Returns available action types for filtering.</summary>
    [HttpGet("action-types")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetActionTypes(CancellationToken ct)
    {
        var types = await _db.SuperAdminEvents
            .AsNoTracking()
            .Select(e => e.Action)
            .Distinct()
            .OrderBy(a => a)
            .ToListAsync(ct);

        return Ok(types);
    }
}

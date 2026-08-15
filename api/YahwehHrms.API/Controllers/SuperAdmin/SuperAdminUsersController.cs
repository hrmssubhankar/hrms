using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.Api.Controllers.SuperAdmin;

/// <summary>
/// Super Admin — Manage platform-level super admin user accounts.
/// Base route: /api/superadmin/users
/// </summary>
[ApiController]
[Route("api/superadmin/users")]
[Authorize(Roles = "SuperAdmin")]
[Produces("application/json")]
public sealed class SuperAdminUsersController : ControllerBase
{
    private readonly HrmsDbContext _db;

    public SuperAdminUsersController(HrmsDbContext db) => _db = db;

    private Guid CurrentAdminId =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id
        : throw new InvalidOperationException("SuperAdmin ID claim missing.");

    // ── GET /api/superadmin/users ─────────────────────────────────────────────
    [HttpGet]
    [ProducesResponseType<IEnumerable<SuperAdminUserDto>>(200)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var users = await _db.SuperAdminUsers
            .AsNoTracking()
            .OrderBy(u => u.DisplayName)
            .Select(u => new SuperAdminUserDto(
                u.Id, u.Email, u.DisplayName,
                u.IsActive, u.MfaEnabled, u.LastLoginAt, u.CreatedAt))
            .ToListAsync(ct);

        return Ok(users);
    }

    // ── GET /api/superadmin/users/{id} ────────────────────────────────────────
    [HttpGet("{id:guid}")]
    [ProducesResponseType<SuperAdminUserDto>(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var u = await _db.SuperAdminUsers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        return u is null ? NotFound()
            : Ok(new SuperAdminUserDto(u.Id, u.Email, u.DisplayName,
                u.IsActive, u.MfaEnabled, u.LastLoginAt, u.CreatedAt));
    }

    // ── POST /api/superadmin/users ────────────────────────────────────────────
    [HttpPost]
    [ProducesResponseType<SuperAdminUserDto>(201)]
    [ProducesResponseType<ValidationProblemDetails>(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Create(
        [FromBody] CreateSuperAdminUserRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem();

        var email = req.Email.Trim().ToLowerInvariant();

        if (await _db.SuperAdminUsers.AnyAsync(u => u.Email == email, ct))
            return Conflict(new { error = $"A super admin with email '{email}' already exists." });

        var user = new SuperAdminUser
        {
            Id           = Guid.NewGuid(),
            Email        = email,
            DisplayName  = req.DisplayName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            IsActive     = true,
            CreatedAt    = DateTimeOffset.UtcNow,
            UpdatedAt    = DateTimeOffset.UtcNow
        };

        _db.SuperAdminUsers.Add(user);

        _db.SuperAdminEvents.Add(new SuperAdminEvent
        {
            SuperAdminId = CurrentAdminId,
            Action       = "SUPERADMIN_USER_CREATED",
            EntityType   = "super_admin_user",
            EntityId     = user.Id,
            NewValue     = System.Text.Json.JsonSerializer.Serialize(new { user.Email, user.DisplayName })
        });

        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = user.Id },
            new SuperAdminUserDto(user.Id, user.Email, user.DisplayName,
                user.IsActive, user.MfaEnabled, user.LastLoginAt, user.CreatedAt));
    }

    // ── PATCH /api/superadmin/users/{id}/activate ─────────────────────────────
    [HttpPatch("{id:guid}/activate")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        var user = await _db.SuperAdminUsers.FindAsync(new object[] { id }, ct);
        if (user is null) return NotFound();

        user.IsActive  = true;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        _db.SuperAdminEvents.Add(new SuperAdminEvent
        {
            SuperAdminId = CurrentAdminId,
            Action       = "SUPERADMIN_USER_ACTIVATED",
            EntityType   = "super_admin_user",
            EntityId     = id
        });

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── PATCH /api/superadmin/users/{id}/deactivate ───────────────────────────
    [HttpPatch("{id:guid}/deactivate")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        if (id == CurrentAdminId)
            return BadRequest(new { error = "You cannot deactivate your own account." });

        var user = await _db.SuperAdminUsers.FindAsync(new object[] { id }, ct);
        if (user is null) return NotFound();

        user.IsActive  = false;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        _db.SuperAdminEvents.Add(new SuperAdminEvent
        {
            SuperAdminId = CurrentAdminId,
            Action       = "SUPERADMIN_USER_DEACTIVATED",
            EntityType   = "super_admin_user",
            EntityId     = id
        });

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── PATCH /api/superadmin/users/{id}/reset-password ──────────────────────
    [HttpPatch("{id:guid}/reset-password")]
    [ProducesResponseType(204)]
    [ProducesResponseType<ValidationProblemDetails>(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ResetPassword(
        Guid id, [FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem();

        var user = await _db.SuperAdminUsers.FindAsync(new object[] { id }, ct);
        if (user is null) return NotFound();

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.UpdatedAt    = DateTimeOffset.UtcNow;

        _db.SuperAdminEvents.Add(new SuperAdminEvent
        {
            SuperAdminId = CurrentAdminId,
            Action       = "SUPERADMIN_PASSWORD_RESET",
            EntityType   = "super_admin_user",
            EntityId     = id
        });

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public sealed record SuperAdminUserDto(
    Guid   Id,
    string Email,
    string DisplayName,
    bool   IsActive,
    bool   MfaEnabled,
    DateTimeOffset? LastLoginAt,
    DateTimeOffset  CreatedAt);

public sealed record CreateSuperAdminUserRequest(
    [Required][EmailAddress][MaxLength(320)] string Email,
    [Required][MaxLength(200)]               string DisplayName,
    [Required][MinLength(10)]                string Password);

public sealed record ResetPasswordRequest(
    [Required][MinLength(10)] string NewPassword);

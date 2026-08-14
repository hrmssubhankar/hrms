using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Core.Interfaces;

namespace YahwehHrms.Api.Controllers.SuperAdmin;

/// <summary>
/// Super Admin — Module catalog and per-tenant module toggle.
/// Base route: /api/superadmin/modules
///
/// All endpoints require the "SuperAdmin" role claim.
/// </summary>
[ApiController]
[Route("api/superadmin/modules")]
[Authorize(Roles = "SuperAdmin")]
[Produces("application/json")]
public sealed class ModulesController : ControllerBase
{
    private readonly IModuleService _modules;

    public ModulesController(IModuleService modules) => _modules = modules;

    // ── GET /api/superadmin/modules ───────────────────────────────────────────
    /// <summary>Returns the full module catalog (all available modules).</summary>
    [HttpGet]
    [ProducesResponseType<IEnumerable<Module>>(200)]
    public async Task<IActionResult> GetCatalog(CancellationToken ct)
        => Ok(await _modules.GetAllModulesAsync(ct));

    // ── GET /api/superadmin/modules/tenant/{tenantId} ─────────────────────────
    /// <summary>
    /// Returns all module subscriptions for a specific tenant,
    /// including enabled/disabled state and audit trail.
    /// </summary>
    [HttpGet("tenant/{tenantId:guid}")]
    [ProducesResponseType<IEnumerable<ModuleSubscription>>(200)]
    public async Task<IActionResult> GetForTenant(Guid tenantId, CancellationToken ct)
        => Ok(await _modules.GetTenantSubscriptionsAsync(tenantId, ct));

    // ── POST /api/superadmin/modules/tenant/{tenantId}/enable ─────────────────
    /// <summary>
    /// Enables a module for a tenant.
    /// Creates the subscription row if it does not yet exist.
    /// </summary>
    [HttpPost("tenant/{tenantId:guid}/enable")]
    [ProducesResponseType(204)]
    [ProducesResponseType<ValidationProblemDetails>(400)]
    public async Task<IActionResult> Enable(
        Guid tenantId,
        [FromBody] ModuleToggleRequest req,
        CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem();

        await _modules.EnableModuleAsync(tenantId, req.ModuleId, SuperAdminId, req.Notes, ct);
        return NoContent();
    }

    // ── POST /api/superadmin/modules/tenant/{tenantId}/disable ────────────────
    /// <summary>
    /// Disables a module for a tenant.
    /// Creates the subscription row with IsEnabled=false if it does not yet exist.
    /// </summary>
    [HttpPost("tenant/{tenantId:guid}/disable")]
    [ProducesResponseType(204)]
    [ProducesResponseType<ValidationProblemDetails>(400)]
    public async Task<IActionResult> Disable(
        Guid tenantId,
        [FromBody] ModuleToggleRequest req,
        CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem();

        await _modules.DisableModuleAsync(tenantId, req.ModuleId, SuperAdminId, req.Notes, ct);
        return NoContent();
    }

    // ── POST /api/superadmin/modules/tenant/{tenantId}/provision-defaults ─────
    /// <summary>
    /// Re-runs plan-default module provisioning for a tenant.
    /// Useful after a plan upgrade or manual re-sync.
    /// Only adds missing subscriptions — never removes existing ones.
    /// </summary>
    [HttpPost("tenant/{tenantId:guid}/provision-defaults")]
    [ProducesResponseType(204)]
    [ProducesResponseType<ValidationProblemDetails>(400)]
    public async Task<IActionResult> ProvisionDefaults(
        Guid tenantId,
        [FromBody] ProvisionDefaultsRequest req,
        CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem();

        await _modules.ProvisionDefaultModulesAsync(tenantId, req.Plan, SuperAdminId, ct);
        return NoContent();
    }

    // ── GET /api/superadmin/modules/tenant/{tenantId}/keys ───────────────────
    /// <summary>
    /// Returns the set of enabled module keys for a tenant.
    /// Served from the in-memory cache (fast — suitable for polling or guards).
    /// </summary>
    [HttpGet("tenant/{tenantId:guid}/keys")]
    [ProducesResponseType<IReadOnlySet<string>>(200)]
    public async Task<IActionResult> GetEnabledKeys(Guid tenantId, CancellationToken ct)
        => Ok(await _modules.GetEnabledModuleKeysAsync(tenantId, ct));

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Guid SuperAdminId =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id
        : throw new InvalidOperationException("SuperAdmin ID claim missing from token.");
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

public sealed record ModuleToggleRequest(
    [property: System.ComponentModel.DataAnnotations.Required]
    Guid ModuleId,
    string? Notes);

public sealed record ProvisionDefaultsRequest(
    [property: System.ComponentModel.DataAnnotations.Required]
    [property: System.ComponentModel.DataAnnotations.RegularExpression(
        "^(starter|professional|enterprise)$",
        ErrorMessage = "Plan must be starter, professional, or enterprise.")]
    string Plan);

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using YahwehHrms.Core.Entities;
using YahwehHrms.Core.Interfaces;

namespace YahwehHrms.Api.Controllers.SuperAdmin;

/// <summary>
/// Super Admin — Tenant management.
/// Base route: /api/superadmin/tenants
/// </summary>
[ApiController]
[Route("api/superadmin/tenants")]
[Authorize(Roles = "SuperAdmin")]
[Produces("application/json")]
public sealed class TenantsController : ControllerBase
{
    private readonly ITenantService _tenants;
    private readonly IModuleService _modules;

    public TenantsController(ITenantService tenants, IModuleService modules)
    {
        _tenants = tenants;
        _modules = modules;
    }

    [HttpGet]
    [ProducesResponseType<IEnumerable<TenantDto>>(200)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var list = await _tenants.GetAllTenantsAsync(ct);
        return Ok(list.Select(TenantDto.From));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<TenantDto>(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var tenant = await _tenants.GetTenantByIdAsync(id, ct);
        return tenant is null ? NotFound() : Ok(TenantDto.From(tenant));
    }

    [HttpGet("by-subdomain/{subdomain}")]
    [ProducesResponseType<TenantDto>(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetBySubdomain(string subdomain, CancellationToken ct)
    {
        var tenant = await _tenants.GetTenantBySubdomainAsync(subdomain, ct);
        return tenant is null ? NotFound() : Ok(TenantDto.From(tenant));
    }

    [HttpPost]
    [ProducesResponseType<TenantDto>(201)]
    [ProducesResponseType<ValidationProblemDetails>(400)]
    public async Task<IActionResult> Create([FromBody] CreateTenantRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem();

        var tenant = new Tenant
        {
            Name      = req.Name,
            Subdomain = req.Subdomain.ToLowerInvariant().Trim(),
            Plan      = req.Plan
        };

        var created = await _tenants.CreateTenantAsync(tenant, SuperAdminId, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, TenantDto.From(created));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<TenantDto>(200)]
    [ProducesResponseType<ValidationProblemDetails>(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTenantRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem();

        try
        {
            var tenant = new Tenant
            {
                Id       = id,
                Name     = req.Name,
                LogoUrl  = req.LogoUrl,
                Plan     = req.Plan,
                IsActive = req.IsActive
            };

            var updated = await _tenants.UpdateTenantAsync(tenant, SuperAdminId, ct);
            return Ok(TenantDto.From(updated));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        try
        {
            await _tenants.DeactivateTenantAsync(id, SuperAdminId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id:guid}/modules")]
    [ProducesResponseType<IEnumerable<ModuleSubscription>>(200)]
    public async Task<IActionResult> GetModules(Guid id, CancellationToken ct)
    {
        var subs = await _modules.GetTenantSubscriptionsAsync(id, ct);
        return Ok(subs);
    }

    private Guid SuperAdminId =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id
        : throw new InvalidOperationException("SuperAdmin ID claim missing from token.");
}

// ── Request / Response DTOs ────────────────────────────────────────────────────

public sealed record TenantDto(
    Guid   Id,
    string Name,
    string Subdomain,
    string Plan,
    bool   IsActive,
    string? LogoUrl,
    DateTimeOffset CreatedAt)
{
    public static TenantDto From(Tenant t) => new(
        t.Id, t.Name, t.Subdomain, t.Plan, t.IsActive,
        t.LogoUrl, t.CreatedAt);
}

public sealed record CreateTenantRequest(
    [property: System.ComponentModel.DataAnnotations.Required]
    [property: System.ComponentModel.DataAnnotations.MaxLength(200)]
    string Name,

    [property: System.ComponentModel.DataAnnotations.Required]
    [property: System.ComponentModel.DataAnnotations.RegularExpression(@"^[a-z0-9\-]+$",
        ErrorMessage = "Subdomain may only contain lowercase letters, digits, and hyphens.")]
    [property: System.ComponentModel.DataAnnotations.MaxLength(100)]
    string Subdomain,

    [property: System.ComponentModel.DataAnnotations.Required]
    [property: System.ComponentModel.DataAnnotations.RegularExpression(
        "^(starter|professional|enterprise)$",
        ErrorMessage = "Plan must be starter, professional, or enterprise.")]
    string Plan);

public sealed record UpdateTenantRequest(
    [property: System.ComponentModel.DataAnnotations.Required]
    [property: System.ComponentModel.DataAnnotations.MaxLength(200)]
    string Name,

    string? LogoUrl,

    [property: System.ComponentModel.DataAnnotations.Required]
    [property: System.ComponentModel.DataAnnotations.RegularExpression(
        "^(starter|professional|enterprise)$")]
    string Plan,

    bool IsActive);

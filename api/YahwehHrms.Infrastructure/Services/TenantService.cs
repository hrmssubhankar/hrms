using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using YahwehHrms.Core.Entities;
using YahwehHrms.Core.Interfaces;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.Infrastructure.Services;

public class TenantService : ITenantService
{
    private readonly HrmsDbContext      _db;
    private readonly IModuleService     _modules;
    private readonly ILogger<TenantService> _log;

    public TenantService(HrmsDbContext db, IModuleService modules, ILogger<TenantService> log)
    {
        _db      = db;
        _modules = modules;
        _log     = log;
    }

    public async Task<IEnumerable<Tenant>> GetAllTenantsAsync(CancellationToken ct = default)
        => await _db.Tenants
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.Name)
                    .AsNoTracking()
                    .ToListAsync(ct);

    public async Task<Tenant?> GetTenantByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<Tenant?> GetTenantBySubdomainAsync(string subdomain, CancellationToken ct = default)
        => await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Subdomain == subdomain, ct);

    public async Task<Tenant> CreateTenantAsync(Tenant tenant, Guid superAdminId, CancellationToken ct = default)
    {
        _db.Tenants.Add(tenant);

        _db.SuperAdminEvents.Add(new SuperAdminEvent
        {
            SuperAdminId = superAdminId,
            Action       = "TENANT_CREATED",
            EntityType   = "tenant",
            EntityId     = tenant.Id,
            NewValue     = JsonSerializer.Serialize(new { tenant.Name, tenant.Subdomain, tenant.Plan })
        });

        await _db.SaveChangesAsync(ct);

        // Provision plan-default modules automatically
        await _modules.ProvisionDefaultModulesAsync(tenant.Id, tenant.Plan, superAdminId, ct);

        _log.LogInformation("Tenant {TenantId} ({Subdomain}) created by admin {AdminId}",
            tenant.Id, tenant.Subdomain, superAdminId);

        return tenant;
    }

    public async Task<Tenant> UpdateTenantAsync(Tenant tenant, Guid superAdminId, CancellationToken ct = default)
    {
        var existing = await _db.Tenants.FindAsync(new object[] { tenant.Id }, ct)
            ?? throw new KeyNotFoundException($"Tenant {tenant.Id} not found");

        var oldPlan = existing.Plan;

        existing.Name         = tenant.Name;
        existing.LogoUrl      = tenant.LogoUrl;
        existing.Plan         = tenant.Plan;
        existing.IsActive     = tenant.IsActive;

        _db.SuperAdminEvents.Add(new SuperAdminEvent
        {
            SuperAdminId = superAdminId,
            Action       = "TENANT_UPDATED",
            EntityType   = "tenant",
            EntityId     = tenant.Id,
            OldValue     = JsonSerializer.Serialize(new { plan = oldPlan }),
            NewValue     = JsonSerializer.Serialize(new { tenant.Name, tenant.Plan })
        });

        await _db.SaveChangesAsync(ct);

        // If plan was upgraded, provision new default modules
        if (oldPlan != tenant.Plan)
            await _modules.ProvisionDefaultModulesAsync(tenant.Id, tenant.Plan, superAdminId, ct);

        return existing;
    }

    public async Task DeactivateTenantAsync(Guid tenantId, Guid superAdminId, CancellationToken ct = default)
    {
        var tenant = await _db.Tenants.FindAsync(new object[] { tenantId }, ct)
            ?? throw new KeyNotFoundException($"Tenant {tenantId} not found");

        tenant.IsActive = false;

        _db.SuperAdminEvents.Add(new SuperAdminEvent
        {
            SuperAdminId = superAdminId,
            Action       = "TENANT_DEACTIVATED",
            EntityType   = "tenant",
            EntityId     = tenantId
        });

        await _db.SaveChangesAsync(ct);
        _log.LogInformation("Tenant {TenantId} deactivated by admin {AdminId}", tenantId, superAdminId);
    }
}

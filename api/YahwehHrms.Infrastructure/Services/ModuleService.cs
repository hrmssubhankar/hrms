using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using YahwehHrms.Core.Entities;
using YahwehHrms.Core.Interfaces;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.Infrastructure.Services;

/// <summary>
/// Implements IModuleService backed by tenant.module_subscriptions (Supabase / Azure PostgreSQL).
/// Uses IMemoryCache to avoid hitting the DB on every API request —
/// cache key: "tenant_modules:{tenantId}", TTL 5 min (configurable).
/// </summary>
public class ModuleService : IModuleService
{
    private readonly HrmsDbContext  _db;
    private readonly IMemoryCache   _cache;
    private readonly ILogger<ModuleService> _log;

    private static string CacheKey(Guid tenantId) => $"tenant_modules:{tenantId}";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    public ModuleService(HrmsDbContext db, IMemoryCache cache, ILogger<ModuleService> log)
    {
        _db    = db;
        _cache = cache;
        _log   = log;
    }

    // ── Catalog ──────────────────────────────────────────────────────────────

    public async Task<IEnumerable<Module>> GetAllModulesAsync(CancellationToken ct = default)
        => await _db.Modules
                    .Where(m => m.IsAvailable)
                    .OrderBy(m => m.DisplayOrder)
                    .AsNoTracking()
                    .ToListAsync(ct);

    // ── Per-tenant module check ───────────────────────────────────────────────

    public async Task<IReadOnlySet<string>> GetEnabledModuleKeysAsync(Guid tenantId, CancellationToken ct = default)
    {
        if (_cache.TryGetValue(CacheKey(tenantId), out HashSet<string>? cached) && cached is not null)
            return cached;

        var keys = await _db.ModuleSubscriptions
            .Where(s => s.TenantId == tenantId && s.IsEnabled)
            .Include(s => s.Module)
            .Select(s => s.Module!.ModuleKey)
            .AsNoTracking()
            .ToListAsync(ct);

        var set = new HashSet<string>(keys, StringComparer.OrdinalIgnoreCase);
        _cache.Set(CacheKey(tenantId), set, CacheTtl);
        return set;
    }

    public async Task<bool> IsModuleEnabledAsync(Guid tenantId, string moduleKey, CancellationToken ct = default)
    {
        var keys = await GetEnabledModuleKeysAsync(tenantId, ct);
        return keys.Contains(moduleKey);
    }

    // ── Subscription list (Super Admin UI) ───────────────────────────────────

    public async Task<IEnumerable<ModuleSubscription>> GetTenantSubscriptionsAsync(Guid tenantId, CancellationToken ct = default)
        => await _db.ModuleSubscriptions
                    .Where(s => s.TenantId == tenantId)
                    .Include(s => s.Module)
                    .Include(s => s.EnabledByAdmin)
                    .Include(s => s.DisabledByAdmin)
                    .AsNoTracking()
                    .ToListAsync(ct);

    // ── Enable ────────────────────────────────────────────────────────────────

    public async Task EnableModuleAsync(Guid tenantId, Guid moduleId, Guid superAdminId,
        string? notes = null, CancellationToken ct = default)
    {
        var sub = await _db.ModuleSubscriptions
            .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.ModuleId == moduleId, ct);

        if (sub is null)
        {
            sub = new ModuleSubscription
            {
                TenantId  = tenantId,
                ModuleId  = moduleId,
                IsEnabled = true,
                EnabledAt = DateTimeOffset.UtcNow,
                EnabledBy = superAdminId,
                Notes     = notes
            };
            _db.ModuleSubscriptions.Add(sub);
        }
        else
        {
            sub.IsEnabled  = true;
            sub.EnabledAt  = DateTimeOffset.UtcNow;
            sub.EnabledBy  = superAdminId;
            sub.DisabledAt = null;
            sub.Notes      = notes;
        }

        await AppendAuditAsync(superAdminId, "MODULE_ENABLED", "module", moduleId,
            oldValue: new { isEnabled = false },
            newValue: new { isEnabled = true, notes }, ct);

        await _db.SaveChangesAsync(ct);
        InvalidateCache(tenantId);

        _log.LogInformation("Module {ModuleId} ENABLED for tenant {TenantId} by admin {AdminId}",
            moduleId, tenantId, superAdminId);
    }

    // ── Disable ───────────────────────────────────────────────────────────────

    public async Task DisableModuleAsync(Guid tenantId, Guid moduleId, Guid superAdminId,
        string? notes = null, CancellationToken ct = default)
    {
        var sub = await _db.ModuleSubscriptions
            .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.ModuleId == moduleId, ct);

        if (sub is null)
        {
            sub = new ModuleSubscription
            {
                TenantId   = tenantId,
                ModuleId   = moduleId,
                IsEnabled  = false,
                DisabledAt = DateTimeOffset.UtcNow,
                DisabledBy = superAdminId,
                Notes      = notes
            };
            _db.ModuleSubscriptions.Add(sub);
        }
        else
        {
            sub.IsEnabled  = false;
            sub.DisabledAt = DateTimeOffset.UtcNow;
            sub.DisabledBy = superAdminId;
            sub.Notes      = notes;
        }

        await AppendAuditAsync(superAdminId, "MODULE_DISABLED", "module", moduleId,
            oldValue: new { isEnabled = true },
            newValue: new { isEnabled = false, notes }, ct);

        await _db.SaveChangesAsync(ct);
        InvalidateCache(tenantId);

        _log.LogInformation("Module {ModuleId} DISABLED for tenant {TenantId} by admin {AdminId}",
            moduleId, tenantId, superAdminId);
    }

    // ── Provision defaults for new tenant ────────────────────────────────────

    public async Task ProvisionDefaultModulesAsync(Guid tenantId, string plan, Guid superAdminId, CancellationToken ct = default)
    {
        var defaults = await _db.PlanDefaultModules
            .Where(p => p.Plan == plan)
            .Select(p => p.ModuleId)
            .ToListAsync(ct);

        foreach (var moduleId in defaults)
        {
            var exists = await _db.ModuleSubscriptions
                .AnyAsync(s => s.TenantId == tenantId && s.ModuleId == moduleId, ct);

            if (!exists)
            {
                _db.ModuleSubscriptions.Add(new ModuleSubscription
                {
                    TenantId  = tenantId,
                    ModuleId  = moduleId,
                    IsEnabled = true,
                    EnabledAt = DateTimeOffset.UtcNow,
                    EnabledBy = superAdminId,
                    Notes     = $"Auto-provisioned for plan '{plan}'"
                });
            }
        }

        await _db.SaveChangesAsync(ct);
        InvalidateCache(tenantId);

        _log.LogInformation("Provisioned {Count} default modules for tenant {TenantId} (plan: {Plan})",
            defaults.Count, tenantId, plan);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void InvalidateCache(Guid tenantId) => _cache.Remove(CacheKey(tenantId));

    private async Task AppendAuditAsync(Guid superAdminId, string action, string entityType,
        Guid? entityId, object? oldValue, object? newValue, CancellationToken ct)
    {
        _db.SuperAdminEvents.Add(new SuperAdminEvent
        {
            SuperAdminId = superAdminId,
            Action       = action,
            EntityType   = entityType,
            EntityId     = entityId,
            OldValue     = oldValue is null ? null : JsonSerializer.Serialize(oldValue),
            NewValue     = newValue is null ? null : JsonSerializer.Serialize(newValue)
        });
        // SaveChanges called by the caller after this
    }
}

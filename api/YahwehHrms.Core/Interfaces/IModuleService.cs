using YahwehHrms.Core.Entities;

namespace YahwehHrms.Core.Interfaces;

public interface IModuleService
{
    /// <summary>Returns all modules from catalog.modules.</summary>
    Task<IEnumerable<Module>> GetAllModulesAsync(CancellationToken ct = default);

    /// <summary>Returns enabled module keys for a given tenant (fast — cached).</summary>
    Task<IReadOnlySet<string>> GetEnabledModuleKeysAsync(Guid tenantId, CancellationToken ct = default);

    /// <summary>Returns full subscription list for a tenant (for Super Admin UI).</summary>
    Task<IEnumerable<ModuleSubscription>> GetTenantSubscriptionsAsync(Guid tenantId, CancellationToken ct = default);

    /// <summary>Enables a module for a tenant. Creates the subscription row if absent.</summary>
    Task EnableModuleAsync(Guid tenantId, Guid moduleId, Guid superAdminId, string? notes = null, CancellationToken ct = default);

    /// <summary>Disables a module for a tenant.</summary>
    Task DisableModuleAsync(Guid tenantId, Guid moduleId, Guid superAdminId, string? notes = null, CancellationToken ct = default);

    /// <summary>Provisions all plan-default modules for a newly created tenant.</summary>
    Task ProvisionDefaultModulesAsync(Guid tenantId, string plan, Guid superAdminId, CancellationToken ct = default);

    /// <summary>Returns true if the tenant currently has the module enabled.</summary>
    Task<bool> IsModuleEnabledAsync(Guid tenantId, string moduleKey, CancellationToken ct = default);
}

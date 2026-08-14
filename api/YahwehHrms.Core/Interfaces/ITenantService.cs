using YahwehHrms.Core.Entities;

namespace YahwehHrms.Core.Interfaces;

public interface ITenantService
{
    Task<IEnumerable<Tenant>> GetAllTenantsAsync(CancellationToken ct = default);
    Task<Tenant?>             GetTenantByIdAsync(Guid id, CancellationToken ct = default);
    Task<Tenant?>             GetTenantBySubdomainAsync(string subdomain, CancellationToken ct = default);
    Task<Tenant>              CreateTenantAsync(Tenant tenant, Guid superAdminId, CancellationToken ct = default);
    Task<Tenant>              UpdateTenantAsync(Tenant tenant, Guid superAdminId, CancellationToken ct = default);
    Task                      DeactivateTenantAsync(Guid tenantId, Guid superAdminId, CancellationToken ct = default);
}

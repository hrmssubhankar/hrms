using YahwehHrms.Core.Entities;

namespace YahwehHrms.Core.Interfaces;

public interface IDepartmentService
{
    Task<IEnumerable<Department>> GetAllAsync(Guid tenantId, CancellationToken ct = default);
    Task<Department?> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<Department> CreateAsync(Guid tenantId, Department department, CancellationToken ct = default);
    Task<Department> UpdateAsync(Guid tenantId, Department department, CancellationToken ct = default);
    Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default);

    Task<IEnumerable<Position>> GetPositionsAsync(Guid tenantId, Guid? departmentId = null, CancellationToken ct = default);
    Task<Position?> GetPositionByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<Position> CreatePositionAsync(Guid tenantId, Position position, CancellationToken ct = default);
    Task<Position> UpdatePositionAsync(Guid tenantId, Position position, CancellationToken ct = default);
    Task DeletePositionAsync(Guid tenantId, Guid id, CancellationToken ct = default);
}

using YahwehHrms.Core.Entities;

namespace YahwehHrms.Core.Interfaces;

public interface IEmployeeService
{
    Task<IEnumerable<Employee>> GetAllAsync(Guid tenantId, string? status = null, Guid? departmentId = null, Guid? positionId = null, CancellationToken ct = default);
    Task<Employee?> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<Employee> CreateAsync(Guid tenantId, Employee employee, CancellationToken ct = default);
    Task<Employee> UpdateAsync(Guid tenantId, Employee employee, CancellationToken ct = default);
    Task TerminateAsync(Guid tenantId, Guid employeeId, DateOnly effectiveDate, string reason, CancellationToken ct = default);
    Task<IEnumerable<Employee>> GetDirectReportsAsync(Guid tenantId, Guid managerId, CancellationToken ct = default);
    Task<int> GetHeadcountAsync(Guid tenantId, CancellationToken ct = default);
}

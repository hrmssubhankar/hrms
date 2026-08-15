namespace YahwehHrms.Core.Interfaces;

public interface IDashboardService
{
    Task<DashboardStats> GetStatsAsync(Guid tenantId, Guid userId, CancellationToken ct = default);
    Task<IEnumerable<UpcomingCelebration>> GetCelebrationsAsync(Guid tenantId, int daysAhead = 30, CancellationToken ct = default);
}

public record DashboardStats(
    int TotalActiveEmployees,
    int ActiveContracts,
    int OpenJobRequisitions,
    int OpenWhsIncidents,
    int OpenGrievances,
    int PendingTimesheets,
    int NewApplications,
    int UnreadNotifications,
    int NewThisMonth,
    int LeavingThisMonth,
    int AmberCompliance,
    int RedCompliance
);

public record UpcomingCelebration(
    Guid   EmployeeId,
    string FullName,
    string Type,       // birthday | work-anniversary
    DateOnly Date,
    int    DaysUntil
);

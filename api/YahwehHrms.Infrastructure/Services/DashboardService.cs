using Microsoft.EntityFrameworkCore;
using YahwehHrms.Core.Interfaces;
using YahwehHrms.Infrastructure.Data;

namespace YahwehHrms.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly HrmsDbContext _db;

    public DashboardService(HrmsDbContext db) => _db = db;

    public async Task<DashboardStats> GetStatsAsync(Guid tenantId, Guid userId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var startOfMonth = new DateOnly(today.Year, today.Month, 1);
        var endOfMonth   = startOfMonth.AddMonths(1).AddDays(-1);

        var results = await Task.WhenAll(
            _db.Employees.CountAsync(e => e.TenantId == tenantId && e.Status != "terminated", ct),
            _db.Contracts.CountAsync(c => c.TenantId == tenantId && c.Status == "active", ct),
            _db.JobRequisitions.CountAsync(r => r.TenantId == tenantId && r.Status == "open", ct),
            _db.WhsIncidents.CountAsync(i => i.TenantId == tenantId && i.Status != "closed", ct),
            _db.Grievances.CountAsync(g => g.TenantId == tenantId && g.Status == "open", ct),
            _db.Timesheets.CountAsync(t => t.TenantId == tenantId && t.Status == "pending", ct),
            _db.Applications.CountAsync(a => a.TenantId == tenantId && a.Status == "applied", ct),
            _db.Notifications.CountAsync(n => n.TenantId == tenantId && n.UserId == userId && !n.IsRead, ct),
            _db.Employees.CountAsync(e => e.TenantId == tenantId && e.StartDate >= startOfMonth && e.StartDate <= endOfMonth, ct),
            _db.Employees.CountAsync(e => e.TenantId == tenantId && e.EndDate >= startOfMonth && e.EndDate <= endOfMonth, ct),
            _db.ComplianceTracking.CountAsync(c => c.TenantId == tenantId && c.Status == "pending" && c.DueDate <= today.AddDays(30), ct),
            _db.ComplianceTracking.CountAsync(c => c.TenantId == tenantId && c.Status == "pending" && c.DueDate < today, ct)
        );

        return new DashboardStats(
            TotalActiveEmployees:  results[0],
            ActiveContracts:       results[1],
            OpenJobRequisitions:   results[2],
            OpenWhsIncidents:      results[3],
            OpenGrievances:        results[4],
            PendingTimesheets:     results[5],
            NewApplications:       results[6],
            UnreadNotifications:   results[7],
            NewThisMonth:          results[8],
            LeavingThisMonth:      results[9],
            AmberCompliance:       results[10],
            RedCompliance:         results[11]
        );
    }

    public async Task<IEnumerable<UpcomingCelebration>> GetCelebrationsAsync(
        Guid tenantId, int daysAhead = 30, CancellationToken ct = default)
    {
        var today   = DateOnly.FromDateTime(DateTime.UtcNow);
        var cutoff  = today.AddDays(daysAhead);

        var employees = await _db.Employees
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId && e.Status != "terminated")
            .Select(e => new
            {
                e.Id,
                e.FirstName,
                e.LastName,
                e.DateOfBirth,
                e.StartDate
            })
            .ToListAsync(ct);

        var celebrations = new List<UpcomingCelebration>();

        foreach (var emp in employees)
        {
            var fullName = $"{emp.FirstName} {emp.LastName}";

            // Birthdays
            if (emp.DateOfBirth.HasValue)
            {
                var bday = emp.DateOfBirth.Value;
                var nextBday = new DateOnly(today.Year, bday.Month, bday.Day);
                if (nextBday < today) nextBday = nextBday.AddYears(1);
                if (nextBday <= cutoff)
                    celebrations.Add(new UpcomingCelebration(emp.Id, fullName, "birthday", nextBday, nextBday.DayNumber - today.DayNumber));
            }

            // Work anniversaries (only for > 0 years)
            var startDate = emp.StartDate;
            var nextAnni  = new DateOnly(today.Year, startDate.Month, startDate.Day);
            if (nextAnni < today) nextAnni = nextAnni.AddYears(1);
            if (nextAnni <= cutoff && nextAnni.Year > startDate.Year)
                celebrations.Add(new UpcomingCelebration(emp.Id, fullName, "work-anniversary", nextAnni, nextAnni.DayNumber - today.DayNumber));
        }

        return celebrations.OrderBy(c => c.DaysUntil).ToList();
    }
}

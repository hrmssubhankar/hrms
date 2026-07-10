using Microsoft.EntityFrameworkCore;

namespace YahwehHrms.Infrastructure.Data;

/// <summary>
/// EF Core DbContext for the Yahweh HRMS PostgreSQL database.
/// Row-Level Security is enforced at the PostgreSQL level via the tenant_id column.
/// </summary>
public class HrmsDbContext : DbContext
{
    public HrmsDbContext(DbContextOptions<HrmsDbContext> options) : base(options) { }

    // ── Core ─────────────────────────────────────────────────────────────────
    public DbSet<Tenant>     Tenants     { get; set; } = null!;
    public DbSet<TenantModule> TenantModules { get; set; } = null!;
    public DbSet<User>       Users       { get; set; } = null!;
    public DbSet<Employee>   Employees   { get; set; } = null!;
    public DbSet<Department> Departments { get; set; } = null!;
    public DbSet<Position>   Positions   { get; set; } = null!;
    public DbSet<AuditLog>   AuditLogs   { get; set; } = null!;
    public DbSet<Document>   Documents   { get; set; } = null!;

    // ── Compliance ────────────────────────────────────────────────────────────
    public DbSet<ScreeningRecord>    ScreeningRecords   { get; set; } = null!;
    public DbSet<ComplianceTracking> ComplianceTracking { get; set; } = null!;
    public DbSet<OnboardingRecord>   OnboardingRecords  { get; set; } = null!;

    // ── Learning ──────────────────────────────────────────────────────────────
    public DbSet<Course>               Courses               { get; set; } = null!;
    public DbSet<TrainingRecord>       TrainingRecords       { get; set; } = null!;
    public DbSet<Competency>           Competencies          { get; set; } = null!;
    public DbSet<CompetencyAssessment> CompetencyAssessments { get; set; } = null!;
    public DbSet<SupervisionRecord>    SupervisionRecords    { get; set; } = null!;

    // ── Talent ────────────────────────────────────────────────────────────────
    public DbSet<JobRequisition> JobRequisitions { get; set; } = null!;
    public DbSet<Candidate>      Candidates      { get; set; } = null!;
    public DbSet<Application>    Applications    { get; set; } = null!;
    public DbSet<Contract>       Contracts       { get; set; } = null!;

    // ── Performance ───────────────────────────────────────────────────────────
    public DbSet<PerformanceReview> PerformanceReviews { get; set; } = null!;

    // ── Safety ────────────────────────────────────────────────────────────────
    public DbSet<WhsIncident>       WhsIncidents       { get; set; } = null!;
    public DbSet<Grievance>         Grievances         { get; set; } = null!;
    public DbSet<SeparationRecord>  SeparationRecords  { get; set; } = null!;

    // ── Operations ────────────────────────────────────────────────────────────
    public DbSet<Asset>           Assets           { get; set; } = null!;
    public DbSet<AssetAssignment> AssetAssignments { get; set; } = null!;
    public DbSet<Shift>           Shifts           { get; set; } = null!;
    public DbSet<Timesheet>       Timesheets       { get; set; } = null!;
    public DbSet<PayrollRecord>   PayrollRecords   { get; set; } = null!;

    // ── Experience ────────────────────────────────────────────────────────────
    public DbSet<Survey>         Surveys         { get; set; } = null!;
    public DbSet<SurveyResponse> SurveyResponses { get; set; } = null!;
    public DbSet<Recognition>    Recognitions    { get; set; } = null!;
    public DbSet<Referral>       Referrals       { get; set; } = null!;
    public DbSet<Notification>   Notifications   { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HrmsDbContext).Assembly);

        // Default schema
        modelBuilder.HasDefaultSchema("public");

        // Global query filter — multi-tenant isolation
        // NOTE: Supplement with PostgreSQL RLS policies for hard enforcement
    }
}

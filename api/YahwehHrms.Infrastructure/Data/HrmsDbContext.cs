using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YahwehHrms.Core.Entities;

namespace YahwehHrms.Infrastructure.Data;

/// <summary>
/// EF Core DbContext for the Yahweh HRMS PostgreSQL database.
///
/// Schema layout (maps 1:1 to Supabase / Azure PostgreSQL):
///   public  — legacy default; existing tables stay here until a migration moves them
///   iam     — Identity &amp; Access Management  (tenants, super_admin_users)
///   catalog — Product catalog               (modules, plan_default_modules)
///   tenant  — Per-tenant config             (module_subscriptions, settings)
///   audit   — Immutable event log           (super_admin_events)
/// </summary>
public class HrmsDbContext : DbContext
{
    public HrmsDbContext(DbContextOptions<HrmsDbContext> options) : base(options) { }

    // ── public schema (existing) ──────────────────────────────────────────────
    public DbSet<Tenant>     Tenants     { get; set; } = null!;
    public DbSet<TenantModule> TenantModules { get; set; } = null!;   // legacy — superseded by ModuleSubscriptions
    public DbSet<User>       Users       { get; set; } = null!;
    public DbSet<Employee>   Employees   { get; set; } = null!;
    public DbSet<Department> Departments { get; set; } = null!;
    public DbSet<Position>   Positions   { get; set; } = null!;
    public DbSet<AuditLog>   AuditLogs   { get; set; } = null!;
    public DbSet<Document>   Documents   { get; set; } = null!;

    public DbSet<ScreeningRecord>    ScreeningRecords   { get; set; } = null!;
    public DbSet<ComplianceTracking> ComplianceTracking { get; set; } = null!;
    public DbSet<OnboardingRecord>   OnboardingRecords  { get; set; } = null!;

    public DbSet<Course>               Courses               { get; set; } = null!;
    public DbSet<TrainingRecord>       TrainingRecords       { get; set; } = null!;
    public DbSet<Competency>           Competencies          { get; set; } = null!;
    public DbSet<CompetencyAssessment> CompetencyAssessments { get; set; } = null!;
    public DbSet<SupervisionRecord>    SupervisionRecords    { get; set; } = null!;

    public DbSet<JobRequisition> JobRequisitions { get; set; } = null!;
    public DbSet<Candidate>      Candidates      { get; set; } = null!;
    public DbSet<Application>    Applications    { get; set; } = null!;
    public DbSet<Contract>       Contracts       { get; set; } = null!;

    public DbSet<PerformanceReview> PerformanceReviews { get; set; } = null!;

    public DbSet<WhsIncident>       WhsIncidents       { get; set; } = null!;
    public DbSet<Grievance>         Grievances         { get; set; } = null!;
    public DbSet<SeparationRecord>  SeparationRecords  { get; set; } = null!;

    public DbSet<Asset>           Assets           { get; set; } = null!;
    public DbSet<AssetAssignment> AssetAssignments { get; set; } = null!;
    public DbSet<Shift>           Shifts           { get; set; } = null!;
    public DbSet<Timesheet>       Timesheets       { get; set; } = null!;
    public DbSet<PayrollRecord>   PayrollRecords   { get; set; } = null!;

    public DbSet<Survey>         Surveys         { get; set; } = null!;
    public DbSet<SurveyResponse> SurveyResponses { get; set; } = null!;
    public DbSet<Recognition>    Recognitions    { get; set; } = null!;
    public DbSet<Referral>       Referrals       { get; set; } = null!;
    public DbSet<Notification>   Notifications   { get; set; } = null!;

    // ── iam schema ────────────────────────────────────────────────────────────
    public DbSet<SuperAdminUser> SuperAdminUsers { get; set; } = null!;

    // ── catalog schema ────────────────────────────────────────────────────────
    public DbSet<Module>            Modules            { get; set; } = null!;
    public DbSet<PlanDefaultModule> PlanDefaultModules { get; set; } = null!;

    // ── tenant schema ─────────────────────────────────────────────────────────
    public DbSet<ModuleSubscription> ModuleSubscriptions { get; set; } = null!;
    public DbSet<TenantSetting>      TenantSettings      { get; set; } = null!;

    // ── audit schema ──────────────────────────────────────────────────────────
    public DbSet<SuperAdminEvent> SuperAdminEvents { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // Apply all IEntityTypeConfiguration<T> classes in this assembly
        mb.ApplyConfigurationsFromAssembly(typeof(HrmsDbContext).Assembly);

        // Default schema for all tables not explicitly mapped
        mb.HasDefaultSchema("public");

        // ── Core HR relationships (explicit to resolve ambiguous navigations) ─────

        // Tenant collections
        mb.Entity<Tenant>(e =>
        {
            e.HasMany(x => x.Users)
             .WithOne()
             .HasForeignKey(u => u.TenantId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.Employees)
             .WithOne()
             .HasForeignKey(emp => emp.TenantId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.Modules)
             .WithOne(m => m.Tenant)
             .HasForeignKey(m => m.TenantId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Employee relationships
        mb.Entity<Employee>(e =>
        {
            // Employee → Department (many employees, one department)
            e.HasOne(x => x.Department)
             .WithMany(d => d.Employees)
             .HasForeignKey(x => x.DepartmentId)
             .OnDelete(DeleteBehavior.SetNull);

            // Employee → Position
            e.HasOne(x => x.Position)
             .WithMany(p => p.Employees)
             .HasForeignKey(x => x.PositionId)
             .OnDelete(DeleteBehavior.SetNull);

            // Employee self-reference: Manager / DirectReports
            e.HasOne(x => x.Manager)
             .WithMany(x => x.DirectReports)
             .HasForeignKey(x => x.ManagerId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // Department relationships
        mb.Entity<Department>(e =>
        {
            // Department manager → Employee (separate from Employees collection)
            e.HasOne(x => x.Manager)
             .WithMany()
             .HasForeignKey(x => x.ManagerId)
             .OnDelete(DeleteBehavior.SetNull);

            // Department self-reference: Parent / Children
            e.HasOne(x => x.Parent)
             .WithMany(x => x.Children)
             .HasForeignKey(x => x.ParentId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Position → Department
        mb.Entity<Position>(e =>
        {
            e.HasOne(x => x.Department)
             .WithMany(d => d.Positions)
             .HasForeignKey(x => x.DepartmentId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // User → Employee
        mb.Entity<User>(e =>
        {
            e.HasOne(x => x.Employee)
             .WithMany()
             .HasForeignKey(x => x.EmployeeId)
             .OnDelete(DeleteBehavior.SetNull);
        });


        // ── iam.super_admin_users ─────────────────────────────────────────────
        mb.Entity<SuperAdminUser>(e =>
        {
            e.ToTable("super_admin_users", "iam");
            e.HasKey(x => x.Id);
            e.Property(x => x.Email).IsRequired().HasMaxLength(320);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.DisplayName).HasMaxLength(200);
        });

        // ── catalog.modules ───────────────────────────────────────────────────
        mb.Entity<Module>(e =>
        {
            e.ToTable("modules", "catalog");
            e.HasKey(x => x.Id);
            e.Property(x => x.ModuleKey).IsRequired().HasMaxLength(80);
            e.HasIndex(x => x.ModuleKey).IsUnique();
            e.Property(x => x.DisplayName).IsRequired().HasMaxLength(120);
            e.Property(x => x.Category).HasMaxLength(40).HasDefaultValue("core");
        });

        // ── catalog.plan_default_modules ──────────────────────────────────────
        mb.Entity<PlanDefaultModule>(e =>
        {
            e.ToTable("plan_default_modules", "catalog");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.Plan, x.ModuleId }).IsUnique();
            e.Property(x => x.Plan).IsRequired().HasMaxLength(40);
            e.HasOne(x => x.Module)
             .WithMany(m => m.PlanDefaults)
             .HasForeignKey(x => x.ModuleId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── tenant.module_subscriptions ───────────────────────────────────────
        mb.Entity<ModuleSubscription>(e =>
        {
            e.ToTable("module_subscriptions", "tenant");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.ModuleId }).IsUnique();

            e.HasOne(x => x.Tenant)
             .WithMany()
             .HasForeignKey(x => x.TenantId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Module)
             .WithMany(m => m.Subscriptions)
             .HasForeignKey(x => x.ModuleId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.EnabledByAdmin)
             .WithMany(a => a.EnabledSubscriptions)
             .HasForeignKey(x => x.EnabledBy)
             .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(x => x.DisabledByAdmin)
             .WithMany(a => a.DisabledSubscriptions)
             .HasForeignKey(x => x.DisabledBy)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // ── tenant.settings ───────────────────────────────────────────────────
        mb.Entity<TenantSetting>(e =>
        {
            e.ToTable("settings", "tenant");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.SettingKey }).IsUnique();
            e.Property(x => x.SettingKey).IsRequired().HasMaxLength(200);

            e.HasOne(x => x.Tenant)
             .WithMany()
             .HasForeignKey(x => x.TenantId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.UpdatedByAdmin)
             .WithMany()
             .HasForeignKey(x => x.UpdatedBy)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // ── audit.super_admin_events ──────────────────────────────────────────
        mb.Entity<SuperAdminEvent>(e =>
        {
            e.ToTable("super_admin_events", "audit");
            e.HasKey(x => x.Id);
            e.Property(x => x.Action).IsRequired().HasMaxLength(80);
            e.Property(x => x.EntityType).IsRequired().HasMaxLength(80);
            // OldValue / NewValue stored as JSON text (Npgsql maps string to text by default)

            e.HasOne(x => x.SuperAdmin)
             .WithMany(a => a.AuditEvents)
             .HasForeignKey(x => x.SuperAdminId)
             .OnDelete(DeleteBehavior.SetNull);
        });
    }
}

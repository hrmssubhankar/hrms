using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YahwehHrms.Core.Entities;

namespace YahwehHrms.Infrastructure.Data;

/// <summary>
/// EF Core DbContext for the Yahweh HRMS PostgreSQL database.
///
/// Schema layout (maps 1:1 to Supabase / Azure PostgreSQL):
///   public  — core HR tables, all prefixed hrms_
///   iam     — Identity &amp; Access Management  (hrms_super_admin_users)
///   catalog — Product catalog               (hrms_modules, hrms_plan_default_modules)
///   tenant  — Per-tenant config             (hrms_module_subscriptions, hrms_settings)
///   audit   — Immutable event log           (hrms_super_admin_events)
/// </summary>
public class HrmsDbContext : DbContext
{
    public HrmsDbContext(DbContextOptions<HrmsDbContext> options) : base(options) { }

    // ── public schema ─────────────────────────────────────────────────────────
    public DbSet<Tenant>     Tenants     { get; set; } = null!;
    public DbSet<TenantModule> TenantModules { get; set; } = null!;
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

        // ── public schema — hrms_ prefixed table names ────────────────────────

        mb.Entity<Tenant>().ToTable("hrms_tenants");
        mb.Entity<TenantModule>().ToTable("hrms_tenant_modules");
        mb.Entity<User>().ToTable("hrms_users");
        mb.Entity<Employee>().ToTable("hrms_employees");
        mb.Entity<Department>().ToTable("hrms_departments");
        mb.Entity<Position>().ToTable("hrms_positions");
        mb.Entity<AuditLog>().ToTable("hrms_audit_logs");
        mb.Entity<Document>().ToTable("hrms_documents");

        mb.Entity<ScreeningRecord>().ToTable("hrms_screening_records");
        mb.Entity<ComplianceTracking>().ToTable("hrms_compliance_tracking");
        mb.Entity<OnboardingRecord>().ToTable("hrms_onboarding_records");

        mb.Entity<Course>().ToTable("hrms_courses");
        mb.Entity<TrainingRecord>().ToTable("hrms_training_records");
        mb.Entity<Competency>().ToTable("hrms_competencies");
        mb.Entity<CompetencyAssessment>().ToTable("hrms_competency_assessments");
        mb.Entity<SupervisionRecord>().ToTable("hrms_supervision_records");

        mb.Entity<JobRequisition>().ToTable("hrms_job_requisitions");
        mb.Entity<Candidate>().ToTable("hrms_candidates");
        mb.Entity<Application>().ToTable("hrms_applications");
        mb.Entity<Contract>().ToTable("hrms_contracts");

        mb.Entity<PerformanceReview>().ToTable("hrms_performance_reviews");

        mb.Entity<WhsIncident>().ToTable("hrms_whs_incidents");
        mb.Entity<Grievance>().ToTable("hrms_grievances");
        mb.Entity<SeparationRecord>().ToTable("hrms_separation_records");

        mb.Entity<Asset>().ToTable("hrms_assets");
        mb.Entity<AssetAssignment>().ToTable("hrms_asset_assignments");
        mb.Entity<Shift>().ToTable("hrms_shifts");
        mb.Entity<Timesheet>().ToTable("hrms_timesheets");
        mb.Entity<PayrollRecord>().ToTable("hrms_payroll_records");

        mb.Entity<Survey>().ToTable("hrms_surveys");
        mb.Entity<SurveyResponse>().ToTable("hrms_survey_responses");
        mb.Entity<Recognition>().ToTable("hrms_recognitions");
        mb.Entity<Referral>().ToTable("hrms_referrals");
        mb.Entity<Notification>().ToTable("hrms_notifications");

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

        // ── iam.hrms_super_admin_users ────────────────────────────────────────
        mb.Entity<SuperAdminUser>(e =>
        {
            e.ToTable("hrms_super_admin_users", "iam");
            e.HasKey(x => x.Id);
            e.Property(x => x.Email).IsRequired().HasMaxLength(320);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.DisplayName).HasMaxLength(200);
        });

        // ── catalog.hrms_modules ──────────────────────────────────────────────
        mb.Entity<Module>(e =>
        {
            e.ToTable("hrms_modules", "catalog");
            e.HasKey(x => x.Id);
            e.Property(x => x.ModuleKey).IsRequired().HasMaxLength(80);
            e.HasIndex(x => x.ModuleKey).IsUnique();
            e.Property(x => x.DisplayName).IsRequired().HasMaxLength(120);
            e.Property(x => x.Category).HasMaxLength(40).HasDefaultValue("core");
        });

        // ── catalog.hrms_plan_default_modules ─────────────────────────────────
        mb.Entity<PlanDefaultModule>(e =>
        {
            e.ToTable("hrms_plan_default_modules", "catalog");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.Plan, x.ModuleId }).IsUnique();
            e.Property(x => x.Plan).IsRequired().HasMaxLength(40);
            e.HasOne(x => x.Module)
             .WithMany(m => m.PlanDefaults)
             .HasForeignKey(x => x.ModuleId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── tenant.hrms_module_subscriptions ──────────────────────────────────
        mb.Entity<ModuleSubscription>(e =>
        {
            e.ToTable("hrms_module_subscriptions", "tenant");
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

        // ── tenant.hrms_settings ──────────────────────────────────────────────
        mb.Entity<TenantSetting>(e =>
        {
            e.ToTable("hrms_settings", "tenant");
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

        // ── audit.hrms_super_admin_events ─────────────────────────────────────
        mb.Entity<SuperAdminEvent>(e =>
        {
            e.ToTable("hrms_super_admin_events", "audit");
            e.HasKey(x => x.Id);
            e.Property(x => x.Action).IsRequired().HasMaxLength(80);
            e.Property(x => x.EntityType).IsRequired().HasMaxLength(80);

            e.HasOne(x => x.SuperAdmin)
             .WithMany(a => a.AuditEvents)
             .HasForeignKey(x => x.SuperAdminId)
             .OnDelete(DeleteBehavior.SetNull);
        });
    }
}

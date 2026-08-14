using System;
using System.Collections.Generic;

namespace YahwehHrms.Core.Entities;

// ── Base ──────────────────────────────────────────────────────────────────────
public abstract class BaseEntity
{
    public Guid   Id        { get; set; } = Guid.NewGuid();
    public Guid   TenantId  { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

// ── Tenant / Multi-tenancy ────────────────────────────────────────────────────
public class Tenant
{
    public Guid     Id          { get; set; } = Guid.NewGuid();
    public string   Name        { get; set; } = "";
    public string   Subdomain   { get; set; } = "";
    public string?  LogoUrl     { get; set; }
    public string   Plan        { get; set; } = "starter";   // starter | pro | enterprise
    public bool     IsActive    { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<TenantModule> Modules   { get; set; } = new List<TenantModule>();
    public ICollection<User>         Users     { get; set; } = new List<User>();
    public ICollection<Employee>     Employees { get; set; } = new List<Employee>();
}

public class TenantModule
{
    public Guid   Id         { get; set; } = Guid.NewGuid();
    public Guid   TenantId   { get; set; }
    public string ModuleKey  { get; set; } = "";   // e.g. "recruitment", "payroll"
    public bool   IsEnabled  { get; set; } = true;
    public DateTimeOffset EnabledAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
}

// ── Identity ──────────────────────────────────────────────────────────────────
public class User : BaseEntity
{
    public string  Email          { get; set; } = "";
    public string  PasswordHash   { get; set; } = "";
    public string  Role           { get; set; } = "employee";   // super-admin | admin | manager | employee
    public bool    IsActive       { get; set; } = true;
    public string? TotpSecret     { get; set; }
    public bool    MfaEnabled     { get; set; } = false;
    public DateTimeOffset? LastLogin { get; set; }
    public Guid?   EmployeeId     { get; set; }

    public Employee?       Employee { get; set; }
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}

// ── Core HR ───────────────────────────────────────────────────────────────────
public class Employee : BaseEntity
{
    public string  FirstName      { get; set; } = "";
    public string  LastName       { get; set; } = "";
    public string  Email          { get; set; } = "";
    public string? Phone          { get; set; }
    public string  EmployeeNumber { get; set; } = "";
    public DateOnly? DateOfBirth  { get; set; }
    public string?  Gender        { get; set; }
    public string   Status        { get; set; } = "active";  // active | inactive | terminated
    public DateOnly  StartDate    { get; set; }
    public DateOnly? EndDate      { get; set; }
    public string   EmploymentType { get; set; } = "full-time"; // full-time | part-time | casual | contractor
    public Guid?   DepartmentId   { get; set; }
    public Guid?   PositionId     { get; set; }
    public Guid?   ManagerId      { get; set; }
    public string? AvatarUrl      { get; set; }
    public string? Address        { get; set; }
    public string? TaxFileNumber  { get; set; }
    public string? BankAccount    { get; set; }
    public decimal? Salary        { get; set; }

    public Department?            Department    { get; set; }
    public Position?              Position      { get; set; }
    public Employee?              Manager       { get; set; }
    public ICollection<Employee>  DirectReports { get; set; } = new List<Employee>();
    public ICollection<Document>  Documents     { get; set; } = new List<Document>();
    public ICollection<Contract>  Contracts     { get; set; } = new List<Contract>();
}

public class Department : BaseEntity
{
    public string  Name        { get; set; } = "";
    public string? Description { get; set; }
    public string? Code        { get; set; }
    public Guid?   ManagerId   { get; set; }
    public Guid?   ParentId    { get; set; }
    public bool    IsActive    { get; set; } = true;

    public Employee?               Manager     { get; set; }
    public Department?             Parent      { get; set; }
    public ICollection<Department> Children    { get; set; } = new List<Department>();
    public ICollection<Employee>   Employees   { get; set; } = new List<Employee>();
    public ICollection<Position>   Positions   { get; set; } = new List<Position>();
}

public class Position : BaseEntity
{
    public string  Title        { get; set; } = "";
    public string? Description  { get; set; }
    public string? Code         { get; set; }
    public Guid?   DepartmentId { get; set; }
    public decimal? MinSalary   { get; set; }
    public decimal? MaxSalary   { get; set; }
    public bool    IsActive     { get; set; } = true;

    public Department?          Department { get; set; }
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}

// ── Audit ─────────────────────────────────────────────────────────────────────
public class AuditLog
{
    public Guid   Id         { get; set; } = Guid.NewGuid();
    public Guid   TenantId   { get; set; }
    public Guid?  UserId     { get; set; }
    public string Action     { get; set; } = "";     // CREATE | UPDATE | DELETE | LOGIN
    public string Entity     { get; set; } = "";
    public string? EntityId  { get; set; }
    public string? OldValues { get; set; }           // JSON
    public string? NewValues { get; set; }           // JSON
    public string? IpAddress { get; set; }
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
}

// ── Documents ─────────────────────────────────────────────────────────────────
public class Document : BaseEntity
{
    public string  Name         { get; set; } = "";
    public string  Category     { get; set; } = "general";  // contract | policy | certificate | id | other
    public string  StorageUrl   { get; set; } = "";
    public string? ContentType  { get; set; }
    public long    SizeBytes    { get; set; }
    public Guid?   EmployeeId   { get; set; }
    public DateOnly? ExpiresOn  { get; set; }
    public bool    IsConfidential { get; set; } = false;

    public Employee? Employee { get; set; }
}

// ── Compliance ────────────────────────────────────────────────────────────────
public class ScreeningRecord : BaseEntity
{
    public Guid    EmployeeId    { get; set; }
    public string  Type          { get; set; } = "";   // police-check | wwcc | medical | reference
    public string  Status        { get; set; } = "pending"; // pending | passed | failed | expired
    public DateOnly? CompletedOn { get; set; }
    public DateOnly? ExpiresOn   { get; set; }
    public string?   Notes       { get; set; }
    public string?   DocumentUrl { get; set; }
    public Guid?     VerifiedBy  { get; set; }

    public Employee? Employee { get; set; }
}

public class ComplianceTracking : BaseEntity
{
    public Guid   EmployeeId      { get; set; }
    public string Requirement     { get; set; } = "";   // e.g. "Annual Fire Safety Training"
    public string Category        { get; set; } = "";
    public string Status          { get; set; } = "pending";
    public DateOnly? DueDate      { get; set; }
    public DateOnly? CompletedOn  { get; set; }
    public string?   Notes        { get; set; }

    public Employee? Employee { get; set; }
}

public class OnboardingRecord : BaseEntity
{
    public Guid   EmployeeId    { get; set; }
    public string Stage         { get; set; } = "pre-start";  // pre-start | week-1 | month-1 | probation
    public string Status        { get; set; } = "in-progress";
    public string? Notes        { get; set; }
    public DateOnly? CompletedOn { get; set; }
    public Guid?  AssignedTo    { get; set; }
    public string? Checklist    { get; set; }  // JSON array of checklist items

    public Employee? Employee { get; set; }
}

// ── Learning & Development ────────────────────────────────────────────────────
public class Course : BaseEntity
{
    public string  Title        { get; set; } = "";
    public string? Description  { get; set; }
    public string  Category     { get; set; } = "general";
    public string? Provider     { get; set; }
    public int?    DurationMins { get; set; }
    public bool    IsMandatory  { get; set; } = false;
    public bool    IsActive     { get; set; } = true;
    public string? ContentUrl   { get; set; }

    public ICollection<TrainingRecord> TrainingRecords { get; set; } = new List<TrainingRecord>();
}

public class TrainingRecord : BaseEntity
{
    public Guid    EmployeeId   { get; set; }
    public Guid    CourseId     { get; set; }
    public string  Status       { get; set; } = "enrolled"; // enrolled | in-progress | completed | failed
    public int?    ScorePercent { get; set; }
    public DateOnly? StartedOn  { get; set; }
    public DateOnly? CompletedOn { get; set; }
    public DateOnly? ExpiresOn  { get; set; }
    public string? CertificateUrl { get; set; }

    public Employee? Employee { get; set; }
    public Course?   Course   { get; set; }
}

public class Competency : BaseEntity
{
    public string  Name        { get; set; } = "";
    public string? Description { get; set; }
    public string  Category    { get; set; } = "technical"; // technical | behavioural | leadership
    public bool    IsActive    { get; set; } = true;

    public ICollection<CompetencyAssessment> Assessments { get; set; } = new List<CompetencyAssessment>();
}

public class CompetencyAssessment : BaseEntity
{
    public Guid   EmployeeId   { get; set; }
    public Guid   CompetencyId { get; set; }
    public int    Level        { get; set; } = 1;  // 1–5
    public string? Notes       { get; set; }
    public Guid?  AssessedBy   { get; set; }
    public DateOnly AssessedOn { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    public Employee?   Employee   { get; set; }
    public Competency? Competency { get; set; }
}

public class SupervisionRecord : BaseEntity
{
    public Guid    EmployeeId   { get; set; }
    public Guid    SupervisorId { get; set; }
    public DateOnly SessionDate { get; set; }
    public string? Notes        { get; set; }
    public string? ActionItems  { get; set; }  // JSON
    public bool    IsCompleted  { get; set; } = false;

    public Employee? Employee   { get; set; }
    public Employee? Supervisor { get; set; }
}

// ── Talent Acquisition ────────────────────────────────────────────────────────
public class JobRequisition : BaseEntity
{
    public string  Title        { get; set; } = "";
    public Guid?   DepartmentId { get; set; }
    public Guid?   PositionId   { get; set; }
    public string  Status       { get; set; } = "draft"; // draft | open | on-hold | filled | cancelled
    public string  Type         { get; set; } = "full-time";
    public int     Headcount    { get; set; } = 1;
    public string? Description  { get; set; }
    public DateOnly? ClosingDate { get; set; }
    public Guid?   HiringManager { get; set; }
    public decimal? Budget      { get; set; }

    public Department?          Department   { get; set; }
    public ICollection<Application> Applications { get; set; } = new List<Application>();
}

public class Candidate : BaseEntity
{
    public string  FirstName   { get; set; } = "";
    public string  LastName    { get; set; } = "";
    public string  Email       { get; set; } = "";
    public string? Phone       { get; set; }
    public string? ResumeUrl   { get; set; }
    public string? Source      { get; set; }  // seek | linkedin | referral | direct
    public Guid?   ReferredBy  { get; set; }

    public ICollection<Application> Applications { get; set; } = new List<Application>();
}

public class Application : BaseEntity
{
    public Guid    CandidateId      { get; set; }
    public Guid    JobRequisitionId { get; set; }
    public string  Status           { get; set; } = "applied"; // applied | screening | interview | offer | hired | rejected
    public string? Notes            { get; set; }
    public DateOnly? InterviewDate  { get; set; }
    public decimal? OfferedSalary   { get; set; }
    public DateOnly? OfferExpiry    { get; set; }

    public Candidate?      Candidate      { get; set; }
    public JobRequisition? JobRequisition { get; set; }
}

public class Contract : BaseEntity
{
    public Guid     EmployeeId   { get; set; }
    public string   Type         { get; set; } = "permanent"; // permanent | fixed-term | casual | contractor
    public DateOnly StartDate    { get; set; }
    public DateOnly? EndDate     { get; set; }
    public decimal  Salary       { get; set; }
    public string   PayFrequency { get; set; } = "monthly"; // weekly | fortnightly | monthly
    public string   Status       { get; set; } = "active";  // draft | active | expired | terminated
    public string?  DocumentUrl  { get; set; }
    public bool     IsSigned     { get; set; } = false;

    public Employee? Employee { get; set; }
}

// ── Performance ───────────────────────────────────────────────────────────────
public class PerformanceReview : BaseEntity
{
    public Guid    EmployeeId   { get; set; }
    public Guid    ReviewerId   { get; set; }
    public string  Period       { get; set; } = "";   // e.g. "2024-H1"
    public string  Type         { get; set; } = "annual"; // annual | mid-year | probation | 90-day
    public string  Status       { get; set; } = "draft";  // draft | in-progress | completed
    public int?    OverallScore { get; set; }  // 1–5
    public string? Goals        { get; set; }  // JSON
    public string? Achievements { get; set; }  // JSON
    public string? ManagerNotes { get; set; }
    public string? EmployeeNotes { get; set; }
    public DateOnly? DueDate    { get; set; }
    public DateOnly? CompletedOn { get; set; }

    public Employee? Employee { get; set; }
    public Employee? Reviewer { get; set; }
}

// ── Safety & ER ───────────────────────────────────────────────────────────────
public class WhsIncident : BaseEntity
{
    public Guid    ReportedBy   { get; set; }
    public Guid?   EmployeeId   { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
    public string  Type         { get; set; } = "near-miss"; // near-miss | injury | illness | property-damage | environmental
    public string  Severity     { get; set; } = "low";  // low | medium | high | critical
    public string  Location     { get; set; } = "";
    public string  Description  { get; set; } = "";
    public string  Status       { get; set; } = "open"; // open | investigating | closed
    public string? CorrectiveActions { get; set; }
    public DateOnly? ClosedOn   { get; set; }
    public bool    LostTime     { get; set; } = false;

    public Employee? Employee { get; set; }
}

public class Grievance : BaseEntity
{
    public Guid   EmployeeId    { get; set; }
    public string Category      { get; set; } = "general"; // harassment | discrimination | pay | bullying | general
    public string Description   { get; set; } = "";
    public string Status        { get; set; } = "open";    // open | investigating | resolved | escalated
    public bool   IsAnonymous   { get; set; } = false;
    public string? Resolution   { get; set; }
    public Guid?  AssignedTo    { get; set; }
    public DateOnly? ResolvedOn { get; set; }

    public Employee? Employee { get; set; }
}

public class SeparationRecord : BaseEntity
{
    public Guid    EmployeeId       { get; set; }
    public string  Type             { get; set; } = "resignation"; // resignation | termination | redundancy | retirement | end-of-contract
    public DateOnly EffectiveDate   { get; set; }
    public string? Reason           { get; set; }
    public string  Status           { get; set; } = "in-progress"; // in-progress | completed
    public bool    ExitInterviewDone { get; set; } = false;
    public string? ExitNotes        { get; set; }
    public decimal? FinalPay        { get; set; }
    public bool    EquipmentReturned { get; set; } = false;
    public Guid?   ProcessedBy      { get; set; }

    public Employee? Employee { get; set; }
}

// ── Operations ────────────────────────────────────────────────────────────────
public class Asset : BaseEntity
{
    public string  Name          { get; set; } = "";
    public string  AssetNumber   { get; set; } = "";
    public string  Category      { get; set; } = "hardware"; // hardware | vehicle | furniture | tool | other
    public string? SerialNumber  { get; set; }
    public string  Status        { get; set; } = "available"; // available | assigned | maintenance | disposed
    public decimal? PurchasePrice { get; set; }
    public DateOnly? PurchaseDate { get; set; }
    public DateOnly? WarrantyExpiry { get; set; }
    public string?  Notes        { get; set; }

    public ICollection<AssetAssignment> Assignments { get; set; } = new List<AssetAssignment>();
}

public class AssetAssignment : BaseEntity
{
    public Guid    AssetId     { get; set; }
    public Guid    EmployeeId  { get; set; }
    public DateOnly AssignedOn { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly? ReturnedOn { get; set; }
    public string? Notes       { get; set; }
    public string  Status      { get; set; } = "active"; // active | returned

    public Asset?    Asset    { get; set; }
    public Employee? Employee { get; set; }
}

public class Shift : BaseEntity
{
    public string   Name        { get; set; } = "";
    public Guid?    DepartmentId { get; set; }
    public DayOfWeek? DayOfWeek  { get; set; }
    public TimeOnly  StartTime  { get; set; }
    public TimeOnly  EndTime    { get; set; }
    public bool     IsActive    { get; set; } = true;

    public Department?           Department  { get; set; }
    public ICollection<Timesheet> Timesheets { get; set; } = new List<Timesheet>();
}

public class Timesheet : BaseEntity
{
    public Guid    EmployeeId  { get; set; }
    public Guid?   ShiftId     { get; set; }
    public DateOnly WorkDate   { get; set; }
    public TimeOnly? ClockIn   { get; set; }
    public TimeOnly? ClockOut  { get; set; }
    public decimal? HoursWorked { get; set; }
    public decimal? OvertimeHours { get; set; }
    public string  Status      { get; set; } = "pending"; // pending | approved | rejected
    public string? Notes       { get; set; }
    public Guid?   ApprovedBy  { get; set; }

    public Employee? Employee { get; set; }
    public Shift?    Shift    { get; set; }
}

public class PayrollRecord : BaseEntity
{
    public Guid    EmployeeId    { get; set; }
    public string  Period        { get; set; } = "";  // e.g. "2024-06"
    public decimal GrossPay      { get; set; }
    public decimal Tax           { get; set; }
    public decimal Superannuation { get; set; }
    public decimal Deductions    { get; set; }
    public decimal NetPay        { get; set; }
    public string  Status        { get; set; } = "draft"; // draft | approved | paid
    public DateOnly? PaidOn      { get; set; }
    public string?  Reference    { get; set; }

    public Employee? Employee { get; set; }
}

// ── Employee Experience ───────────────────────────────────────────────────────
public class Survey : BaseEntity
{
    public string  Title        { get; set; } = "";
    public string? Description  { get; set; }
    public string  Type         { get; set; } = "engagement"; // engagement | pulse | exit | onboarding
    public string  Status       { get; set; } = "draft"; // draft | active | closed
    public DateTimeOffset? StartsAt  { get; set; }
    public DateTimeOffset? EndsAt    { get; set; }
    public bool    IsAnonymous  { get; set; } = true;
    public string? Questions    { get; set; }  // JSON array

    public ICollection<SurveyResponse> Responses { get; set; } = new List<SurveyResponse>();
}

public class SurveyResponse : BaseEntity
{
    public Guid   SurveyId   { get; set; }
    public Guid?  EmployeeId { get; set; }  // null if anonymous
    public string Answers    { get; set; } = "{}";  // JSON
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;

    public Survey?   Survey   { get; set; }
    public Employee? Employee { get; set; }
}

public class Recognition : BaseEntity
{
    public Guid   GivenBy     { get; set; }
    public Guid   RecipientId { get; set; }
    public string Category    { get; set; } = "shout-out"; // shout-out | milestone | award | peer
    public string Message     { get; set; } = "";
    public bool   IsPublic    { get; set; } = true;
    public int?   Points      { get; set; }

    public Employee? Giver     { get; set; }
    public Employee? Recipient { get; set; }
}

public class Referral : BaseEntity
{
    public Guid   ReferrerId    { get; set; }
    public Guid?  CandidateId   { get; set; }
    public string CandidateName { get; set; } = "";
    public string CandidateEmail { get; set; } = "";
    public string? JobTitle     { get; set; }
    public string Status        { get; set; } = "submitted"; // submitted | reviewing | hired | rejected
    public decimal? BonusAmount { get; set; }
    public bool    BonusPaid    { get; set; } = false;

    public Employee?  Referrer  { get; set; }
    public Candidate? Candidate { get; set; }
}

public class Notification : BaseEntity
{
    public Guid?  UserId    { get; set; }      // null = broadcast to all
    public string Type      { get; set; } = "info"; // info | warning | success | error
    public string Title     { get; set; } = "";
    public string Message   { get; set; } = "";
    public bool   IsRead    { get; set; } = false;
    public string? ActionUrl { get; set; }
    public DateTimeOffset? ReadAt { get; set; }

    public User? User { get; set; }
}

using System;
using System.Collections.Generic;

namespace YahwehHrms.Core.Entities;

// ── iam schema ────────────────────────────────────────────────────────────────

/// <summary>
/// Platform-level admin. Not scoped to any tenant.
/// Maps to iam.super_admin_users.
/// </summary>
public class SuperAdminUser
{
    public Guid     Id          { get; set; } = Guid.NewGuid();
    public string   Email       { get; set; } = "";
    public string   PasswordHash{ get; set; } = "";
    public string   DisplayName { get; set; } = "";
    public bool     IsActive    { get; set; } = true;
    public bool     MfaEnabled  { get; set; } = false;
    public string?  TotpSecret  { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
    public DateTimeOffset CreatedAt   { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt   { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<ModuleSubscription> EnabledSubscriptions  { get; set; } = new List<ModuleSubscription>();
    public ICollection<ModuleSubscription> DisabledSubscriptions { get; set; } = new List<ModuleSubscription>();
    public ICollection<SuperAdminEvent>    AuditEvents           { get; set; } = new List<SuperAdminEvent>();
}

// ── catalog schema ────────────────────────────────────────────────────────────

/// <summary>
/// Master feature module definition. One row per product feature.
/// module_key is the stable code used everywhere in middleware and front-end guards.
/// Maps to catalog.modules.
/// </summary>
public class Module
{
    public Guid     Id           { get; set; } = Guid.NewGuid();
    /// <summary>Stable slug — NEVER rename once clients are live (e.g. "payroll", "recruitment").</summary>
    public string   ModuleKey    { get; set; } = "";
    public string   DisplayName  { get; set; } = "";
    public string?  Description  { get; set; }
    public string?  IconName     { get; set; }   // Lucide icon name for UI
    /// <summary>core | talent | operations | experience | compliance | analytics</summary>
    public string   Category     { get; set; } = "core";
    /// <summary>FALSE = module is sunset platform-wide (hidden from all tenants).</summary>
    public bool     IsAvailable  { get; set; } = true;
    public short    DisplayOrder { get; set; } = 0;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<PlanDefaultModule>  PlanDefaults   { get; set; } = new List<PlanDefaultModule>();
    public ICollection<ModuleSubscription> Subscriptions  { get; set; } = new List<ModuleSubscription>();
}

/// <summary>
/// Which modules are ON by default for each subscription plan tier.
/// Maps to catalog.plan_default_modules.
/// </summary>
public class PlanDefaultModule
{
    public Guid   Id       { get; set; } = Guid.NewGuid();
    /// <summary>starter | professional | enterprise</summary>
    public string Plan     { get; set; } = "";
    public Guid   ModuleId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Module? Module { get; set; }
}

// ── tenant schema ─────────────────────────────────────────────────────────────

/// <summary>
/// Per-tenant module on/off record. Super Admin creates/updates these.
/// Maps to tenant.module_subscriptions.
/// </summary>
public class ModuleSubscription
{
    public Guid   Id        { get; set; } = Guid.NewGuid();
    public Guid   TenantId  { get; set; }
    public Guid   ModuleId  { get; set; }
    public bool   IsEnabled { get; set; } = true;
    public DateTimeOffset? EnabledAt  { get; set; }
    public DateTimeOffset? DisabledAt { get; set; }
    public Guid?  EnabledBy  { get; set; }   // FK → iam.super_admin_users
    public Guid?  DisabledBy { get; set; }   // FK → iam.super_admin_users
    public string? Notes     { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant?         Tenant          { get; set; }
    public Module?         Module          { get; set; }
    public SuperAdminUser? EnabledByAdmin  { get; set; }
    public SuperAdminUser? DisabledByAdmin { get; set; }
}

/// <summary>
/// Flexible per-tenant key/value configuration.
/// Maps to tenant.settings.
/// </summary>
public class TenantSetting
{
    public Guid   Id           { get; set; } = Guid.NewGuid();
    public Guid   TenantId     { get; set; }
    public string SettingKey   { get; set; } = "";
    public string SettingValue { get; set; } = "";
    public bool   IsSensitive  { get; set; } = false;
    public Guid?  UpdatedBy    { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant?         Tenant        { get; set; }
    public SuperAdminUser? UpdatedByAdmin{ get; set; }
}

// ── audit schema ──────────────────────────────────────────────────────────────

/// <summary>
/// Immutable audit log for all Super Admin actions.
/// Maps to audit.super_admin_events. Never mutate rows.
/// </summary>
public class SuperAdminEvent
{
    public Guid   Id            { get; set; } = Guid.NewGuid();
    public Guid?  SuperAdminId  { get; set; }
    /// <summary>TENANT_CREATED | MODULE_ENABLED | MODULE_DISABLED | TENANT_DEACTIVATED | PLAN_CHANGED</summary>
    public string Action        { get; set; } = "";
    /// <summary>tenant | module | super_admin_user</summary>
    public string EntityType    { get; set; } = "";
    public Guid?  EntityId      { get; set; }
    public string? OldValue     { get; set; }   // JSON
    public string? NewValue     { get; set; }   // JSON
    public string? IpAddress    { get; set; }
    public string? UserAgent    { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public SuperAdminUser? SuperAdmin { get; set; }
}

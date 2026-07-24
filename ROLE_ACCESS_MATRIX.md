# HRMS Role Access Matrix — YPC Tenant
**Tested:** 2026-07-24 | **Tenant:** Yahweh Property Care Pty Ltd  
**Roles tested:** HR Officer · Payroll Officer · Compliance Manager · Operations Manager · Employee · Auditor

---

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ Full | Page loads, full data & write actions visible |
| ✅ Read | Page loads, read-only (management actions hidden) |
| ✅ Personal | Page loads, scoped to own records only |
| ⚠️ Partial | Page loads, some data restricted (API 403 on subset) |
| ❌ Redirect | Navigating to this URL redirects to another page |
| 🐛 Error | Client-side JavaScript exception — page crashes |

---

## Sidebar Navigation (all 31 links appear for every role)

All roles see the same 31 sidebar links. Access is enforced at page/API level, not sidebar visibility.

---

## Module & Page Access Matrix

| Page / Module | HR Officer | Payroll Officer | Compliance Mgr | Operations Mgr | Employee | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard** | ⚠️ Partial | ✅ Full | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial |
| **Employees** | ✅ Full | ❌ Redirect → My Docs | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Roles & Access** | ✅ Full | ⚠️ Partial (0 users) | ⚠️ Partial (0 users) | ⚠️ Partial (0 users) | ⚠️ Partial (0 users) | ⚠️ Partial (0 users) |
| **Audit Logs** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Documents** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Compliance** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Onboarding** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Training** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Competencies** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Supervision** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Workforce Planning** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Recruitment** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Contracts** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Performance** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Safety (WHS)** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Grievances** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Separation** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Analytics** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | 🐛 Error | ✅ Full |
| **Benefits** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Recognition** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Referrals** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **DEI** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Engagement** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Assets** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Rostering** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Payroll** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Leave Management** | ✅ Manager view | ✅ Personal view | ✅ Manager view | ✅ Manager view | ✅ Personal view | ✅ Personal view |
| **Public Holidays** | ✅ Full manage | ✅ Read-only | ✅ Full manage | ✅ Full manage | ✅ Read-only | ✅ Read-only |
| **My Profile** | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked |
| **My Payslips** | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked |
| **My Documents** | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked | ⚠️ Not linked |

---

## Page Sub-sections & Tabs (observed for HR Officer; consistent across roles unless noted)

| Module | Sub-sections / Tabs |
|--------|---------------------|
| Compliance | Screening · Tracking · Lock |
| Training | Course Library · Training Records |
| Assets | Asset Register · Assignments |
| Leave | Requests · Balances · Calendar (+ Leave Settings button) |
| Payroll | Filter tabs: All · Pending · Approved · Paid |
| WHS | Status filters: Open · Investigating · Closed |
| Grievances | Status filters: New · Active · Closed |
| Performance | Type filters: Probation · KPI · PIP · Annual |
| Separation | Type filters: Resignation · Termination · Redundancy · Contract End |
| Audit Logs | Resource filter · Action filter · Date filter |
| Employees | Table: Emp # · Name · Role/Dept · Type · Entity · Start Date · Compliance · Status |
| Documents | Table: Document · Category · Employee · Status · Expiry · Actions |
| Roles & Access | Table: Email · Role · 2FA · Last Login · Status |
| Rostering | Weekly grid: Employee × Mon–Sun |
| Analytics | Headcount · Employment Type · Compliance · Leave · Payroll charts |

---

## Role-specific Behaviour Differences

### Leave Management
| Role | View | Description |
|------|------|-------------|
| HR Officer | Manager | "Review team leave requests, balances and calendar" |
| Compliance Manager | Manager | Same manager view |
| Operations Manager | Manager | Same manager view |
| Payroll Officer | Personal | "Submit and track your leave" |
| Employee | Personal | "Submit and track your leave" |
| Auditor | Personal | "Submit and track your leave" |

### Public Holidays
| Role | Access |
|------|--------|
| HR Officer | Full manage (Import, + Add Holiday) |
| Compliance Manager | Full manage |
| Operations Manager | Full manage |
| Payroll Officer | Read-only (no import/add) |
| Employee | Read-only |
| Auditor | Read-only |

### Dashboard Live Stats
- **Payroll Officer** — sees live dashboard data (Workforce stats, document alerts)
- **All other restricted roles** — "Could not load live stats (403). You may not have manager-level access."

### Roles & Access Page
- **HR Officer** — sees full user list with Email, Role, 2FA, Last Login, Status
- **All other roles** — page loads but returns 0 users (API filters results by role)

---

## 🐛 Bugs & Issues Found

### BUG-1 · Critical — Employee crashes on Analytics page
- **Role:** Employee
- **URL:** `/tenant/analytics`
- **Error:** "Application error: a client-side exception has occurred"
- **Expected:** Either load the page with restricted data, or redirect with a friendly "Access Denied" message
- **Fix:** Add role guard to the Analytics page component; catch errors when the analytics API returns 403 for the `employee` role

### BUG-2 · Medium — Payroll Officer blocked from Employee Management (redirect) but Employee role is not
- **Payroll Officer** → `/tenant/employee-management` redirects to `/tenant/my-documents`
- **Employee** → `/tenant/employee-management` loads fully ("Manage your workforce")
- **Issue:** A lower-privilege `employee` has more access to employee records than a `payroll_officer`. This is likely an inverted permission check — the guard may be checking `isEmployee` to allow access rather than `hasHRAccess`.
- **Fix:** Review middleware/guard on `/tenant/employee-management`; Payroll Officer should have read access, Employee should have limited/no access to other employees' records

### BUG-3 · Medium — Dashboard live stats 403 for HR Officer
- **HR Officer** cannot load dashboard statistics ("Could not load live stats (403)")
- **Payroll Officer** sees full dashboard stats
- **Expected:** HR Officer should have at least equal dashboard visibility to Payroll Officer
- **Fix:** Review `/api/tenant/dashboard/stats` permission check — ensure `hr_officer` is included in allowed roles

### BUG-4 · Low — Roles & Access returns empty list for non-HR roles
- All roles except HR Officer see "Total Users 0 · Active 0 · Suspended 0" on `/tenant/roles`
- **Expected behaviour options:** Either show read-only user list (for manager roles) or hide the page from sidebar entirely for restricted roles
- **Current state:** Page is accessible (no redirect) but shows no data — misleading UX

### BUG-5 · Low — My Profile / My Payslips / My Documents: "Profile Not Linked" for all test users
- All 6 test role accounts show "Profile Not Linked" on personal portal pages
- **Fix:** Link test user accounts to employee records in the database seed

---

## Summary

| Role | Total pages accessible | Key restrictions |
|------|----------------------|-----------------|
| HR Officer | 31/31 | Dashboard stats 403; manager-scoped pages |
| Payroll Officer | 30/31 | Blocked from Employee Management; personal leave view |
| Compliance Manager | 31/31 | Dashboard stats 403; manager-scoped pages |
| Operations Manager | 31/31 | Dashboard stats 403; manager-scoped pages |
| Employee | 31/31 | Analytics crashes (BUG); personal leave/holidays view |
| Auditor | 31/31 | Personal leave/holidays view |

**Total bugs identified:** 5 (1 critical, 2 medium, 2 low)

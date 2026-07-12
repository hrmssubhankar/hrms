/**
 * Leave type configuration — canonical defaults and helpers.
 *
 * Leave type config is stored per-tenant in tenant.settings.leaveTypes.
 * If absent, DEFAULT_LEAVE_TYPES is used.
 *
 * Australian Fair Work Act 2009 defaults:
 *   Annual Leave         20 days FT / pro-rata PT / 0 casual
 *   Personal/Carer       10 days FT+PT / 2 days casual (per occasion)
 *   Compassionate         2 days per event (all)
 *   Long Service         65 days FT after 10 years (state-specific)
 *   Unpaid               unlimited (employer discretion)
 */

export type LeaveTypeConfig = {
  key:                   string   // must match DB enum value
  label:                 string
  emoji:                 string
  color:                 string   // hex or Tailwind token
  entitlementDaysFT:     number   // full-time entitlement per year
  entitlementDaysPT:     number   // part-time (same as FT — pro-rata applied externally)
  entitlementDaysCasual: number   // casual entitlement per year
  accrualNote:           string   // human-readable rule
  isActive:              boolean
}

export const DEFAULT_LEAVE_TYPES: LeaveTypeConfig[] = [
  {
    key:                   'annual',
    label:                 'Annual Leave',
    emoji:                 '🌴',
    color:                 '#22c55e',
    entitlementDaysFT:     20,
    entitlementDaysPT:     20,
    entitlementDaysCasual: 0,
    accrualNote:           '4 weeks per year (FWA s.87)',
    isActive:              true,
  },
  {
    key:                   'sick',
    label:                 'Sick Leave',
    emoji:                 '🤒',
    color:                 '#f97316',
    entitlementDaysFT:     10,
    entitlementDaysPT:     10,
    entitlementDaysCasual: 0,
    accrualNote:           '10 days per year, part of personal/carer leave (FWA s.97)',
    isActive:              true,
  },
  {
    key:                   'personal',
    label:                 "Personal / Carer's Leave",
    emoji:                 '👤',
    color:                 '#8b5cf6',
    entitlementDaysFT:     10,
    entitlementDaysPT:     10,
    entitlementDaysCasual: 2,
    accrualNote:           '10 days per year FT/PT; 2 days per occasion casual (FWA s.97)',
    isActive:              true,
  },
  {
    key:                   'carer',
    label:                 "Carer's Leave",
    emoji:                 '🤝',
    color:                 '#06b6d4',
    entitlementDaysFT:     10,
    entitlementDaysPT:     10,
    entitlementDaysCasual: 2,
    accrualNote:           'Drawn from personal/carer leave pool (FWA s.97)',
    isActive:              true,
  },
  {
    key:                   'compassionate',
    label:                 'Compassionate Leave',
    emoji:                 '🕊',
    color:                 '#64748b',
    entitlementDaysFT:     2,
    entitlementDaysPT:     2,
    entitlementDaysCasual: 2,
    accrualNote:           '2 days per bereavement/serious illness event (FWA s.104)',
    isActive:              true,
  },
  {
    key:                   'long_service',
    label:                 'Long Service Leave',
    emoji:                 '🏅',
    color:                 '#eab308',
    entitlementDaysFT:     65,
    entitlementDaysPT:     65,
    entitlementDaysCasual: 0,
    accrualNote:           '~13 weeks after 10 years — state law applies',
    isActive:              true,
  },
  {
    key:                   'unpaid',
    label:                 'Unpaid Leave',
    emoji:                 '💸',
    color:                 '#94a3b8',
    entitlementDaysFT:     999,
    entitlementDaysPT:     999,
    entitlementDaysCasual: 999,
    accrualNote:           'By agreement — no statutory cap',
    isActive:              true,
  },
]

/** Merge saved tenant config over defaults (by key) */
export function mergeLeaveTypes(saved: Partial<LeaveTypeConfig>[]): LeaveTypeConfig[] {
  return DEFAULT_LEAVE_TYPES.map(def => {
    const override = saved.find(s => s.key === def.key)
    return override ? { ...def, ...override } : def
  })
}

/** Entitlement days for a given employment type */
export function entitlementDays(cfg: LeaveTypeConfig, employmentType: string): number {
  if (employmentType === 'casual' || employmentType === 'contractor') return cfg.entitlementDaysCasual
  if (employmentType === 'part_time') return cfg.entitlementDaysPT
  return cfg.entitlementDaysFT   // full_time, volunteer default to FT
}

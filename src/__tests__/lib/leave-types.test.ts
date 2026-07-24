/**
 * Unit tests — Leave type configuration helpers
 * lib/leave/types.ts
 */
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_LEAVE_TYPES,
  mergeLeaveTypes,
  entitlementDays,
  type LeaveTypeConfig,
} from '@/lib/leave/types'

// ── DEFAULT_LEAVE_TYPES ────────────────────────────────────────────────────────

describe('DEFAULT_LEAVE_TYPES', () => {
  it('contains all required Australian leave types', () => {
    const keys = DEFAULT_LEAVE_TYPES.map(t => t.key)
    expect(keys).toContain('annual')
    expect(keys).toContain('sick')
    expect(keys).toContain('personal')
    expect(keys).toContain('carer')
    expect(keys).toContain('compassionate')
    expect(keys).toContain('long_service')
    expect(keys).toContain('unpaid')
  })

  it('annual leave entitlement is 20 days FT (FWA s.87)', () => {
    const annual = DEFAULT_LEAVE_TYPES.find(t => t.key === 'annual')!
    expect(annual.entitlementDaysFT).toBe(20)
    expect(annual.entitlementDaysCasual).toBe(0)
  })

  it('personal/carer leave entitlement is 10 days FT (FWA s.97)', () => {
    const personal = DEFAULT_LEAVE_TYPES.find(t => t.key === 'personal')!
    expect(personal.entitlementDaysFT).toBe(10)
    expect(personal.entitlementDaysCasual).toBe(2) // 2 per occasion for casuals
  })

  it('compassionate leave entitlement is 2 days for all types', () => {
    const comp = DEFAULT_LEAVE_TYPES.find(t => t.key === 'compassionate')!
    expect(comp.entitlementDaysFT).toBe(2)
    expect(comp.entitlementDaysPT).toBe(2)
    expect(comp.entitlementDaysCasual).toBe(2)
  })

  it('all types have label, emoji, color, accrualNote set', () => {
    DEFAULT_LEAVE_TYPES.forEach(lt => {
      expect(lt.label).toBeTruthy()
      expect(lt.emoji).toBeTruthy()
      expect(lt.color).toBeTruthy()
      expect(lt.accrualNote).toBeTruthy()
    })
  })

  it('all default types are active', () => {
    DEFAULT_LEAVE_TYPES.forEach(lt => {
      expect(lt.isActive).toBe(true)
    })
  })
})

// ── mergeLeaveTypes ────────────────────────────────────────────────────────────

describe('mergeLeaveTypes', () => {
  it('returns all default types when saved config is empty', () => {
    const merged = mergeLeaveTypes([])
    expect(merged.length).toBe(DEFAULT_LEAVE_TYPES.length)
    expect(merged).toEqual(DEFAULT_LEAVE_TYPES)
  })

  it('overrides a single field for a matching key', () => {
    const merged = mergeLeaveTypes([{ key: 'annual', isActive: false }])
    const annual = merged.find(t => t.key === 'annual')!
    expect(annual.isActive).toBe(false)
    // Other fields untouched
    expect(annual.entitlementDaysFT).toBe(20)
    expect(annual.label).toBe('Annual Leave')
  })

  it('overrides entitlement days for a specific type', () => {
    const merged = mergeLeaveTypes([{ key: 'sick', entitlementDaysFT: 15 }])
    const sick = merged.find(t => t.key === 'sick')!
    expect(sick.entitlementDaysFT).toBe(15)
    // Other types untouched
    const annual = merged.find(t => t.key === 'annual')!
    expect(annual.entitlementDaysFT).toBe(20)
  })

  it('ignores saved entries with unrecognised keys', () => {
    const merged = mergeLeaveTypes([{ key: 'maternity', entitlementDaysFT: 90 } as any])
    expect(merged.length).toBe(DEFAULT_LEAVE_TYPES.length)
  })

  it('can override multiple types at once', () => {
    const merged = mergeLeaveTypes([
      { key: 'annual', entitlementDaysFT: 25 },
      { key: 'sick', isActive: false },
    ])
    expect(merged.find(t => t.key === 'annual')!.entitlementDaysFT).toBe(25)
    expect(merged.find(t => t.key === 'sick')!.isActive).toBe(false)
  })
})

// ── entitlementDays ────────────────────────────────────────────────────────────

describe('entitlementDays', () => {
  const annual = DEFAULT_LEAVE_TYPES.find(t => t.key === 'annual')!
  const personal = DEFAULT_LEAVE_TYPES.find(t => t.key === 'personal')!

  it('returns FT entitlement for full_time', () => {
    expect(entitlementDays(annual, 'full_time')).toBe(20)
  })

  it('returns PT entitlement for part_time', () => {
    expect(entitlementDays(annual, 'part_time')).toBe(annual.entitlementDaysPT)
  })

  it('returns casual entitlement for casual', () => {
    expect(entitlementDays(annual, 'casual')).toBe(0)
    expect(entitlementDays(personal, 'casual')).toBe(2)
  })

  it('returns casual entitlement for contractor', () => {
    expect(entitlementDays(annual, 'contractor')).toBe(0)
  })

  it('defaults to FT for unknown employment type', () => {
    expect(entitlementDays(annual, 'volunteer')).toBe(20)
  })
})

/**
 * Unit tests — Leave type helpers
 * src/lib/leave/types.ts
 */
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_LEAVE_TYPES,
  mergeLeaveTypes,
  entitlementDays,
  maxCarryForward,
  type LeaveTypeConfig,
} from '@/lib/leave/types'

// ── DEFAULT_LEAVE_TYPES shape ─────────────────────────────────────────────────

describe('DEFAULT_LEAVE_TYPES', () => {
  it('contains all 7 required leave type keys', () => {
    const keys = DEFAULT_LEAVE_TYPES.map(t => t.key)
    expect(keys).toContain('annual')
    expect(keys).toContain('sick')
    expect(keys).toContain('personal')
    expect(keys).toContain('carer')
    expect(keys).toContain('compassionate')
    expect(keys).toContain('long_service')
    expect(keys).toContain('unpaid')
    expect(keys.length).toBe(7)
  })

  it('every entry is active by default', () => {
    for (const lt of DEFAULT_LEAVE_TYPES) {
      expect(lt.isActive).toBe(true)
    }
  })

  it('annual leave has correct FT entitlement (20 days) and unlimited carry-forward', () => {
    const annual = DEFAULT_LEAVE_TYPES.find(t => t.key === 'annual')!
    expect(annual.entitlementDaysFT).toBe(20)
    expect(annual.maxCarryForwardDays).toBeNull()
  })

  it('compassionate leave does not carry forward (maxCarryForwardDays = 0)', () => {
    const comp = DEFAULT_LEAVE_TYPES.find(t => t.key === 'compassionate')!
    expect(comp.maxCarryForwardDays).toBe(0)
    expect(comp.entitlementDaysFT).toBe(2)
  })

  it('unpaid leave has a large nominal entitlement and no carry-forward', () => {
    const unpaid = DEFAULT_LEAVE_TYPES.find(t => t.key === 'unpaid')!
    expect(unpaid.entitlementDaysFT).toBe(999)
    expect(unpaid.maxCarryForwardDays).toBe(0)
  })

  it('casual entitlement is 0 for annual and sick leave', () => {
    const annual = DEFAULT_LEAVE_TYPES.find(t => t.key === 'annual')!
    const sick   = DEFAULT_LEAVE_TYPES.find(t => t.key === 'sick')!
    expect(annual.entitlementDaysCasual).toBe(0)
    expect(sick.entitlementDaysCasual).toBe(0)
  })
})

// ── entitlementDays ───────────────────────────────────────────────────────────

describe('entitlementDays', () => {
  const annual = DEFAULT_LEAVE_TYPES.find(t => t.key === 'annual')!

  it('returns FT entitlement for full_time', () => {
    expect(entitlementDays(annual, 'full_time')).toBe(20)
  })

  it('returns PT entitlement for part_time', () => {
    expect(entitlementDays(annual, 'part_time')).toBe(20)
  })

  it('returns casual entitlement for casual', () => {
    expect(entitlementDays(annual, 'casual')).toBe(0)
  })

  it('returns casual entitlement for contractor', () => {
    expect(entitlementDays(annual, 'contractor')).toBe(0)
  })

  it('defaults to FT entitlement for unknown employment type', () => {
    expect(entitlementDays(annual, 'volunteer')).toBe(20)
    expect(entitlementDays(annual, '')).toBe(20)
  })

  it('returns correct entitlement for personal leave (casual = 2)', () => {
    const personal = DEFAULT_LEAVE_TYPES.find(t => t.key === 'personal')!
    expect(entitlementDays(personal, 'casual')).toBe(2)
    expect(entitlementDays(personal, 'full_time')).toBe(10)
  })
})

// ── maxCarryForward ───────────────────────────────────────────────────────────

describe('maxCarryForward', () => {
  it('returns Infinity when maxCarryForwardDays is null (unlimited)', () => {
    const annual = DEFAULT_LEAVE_TYPES.find(t => t.key === 'annual')!
    expect(maxCarryForward(annual)).toBe(Infinity)
  })

  it('returns 0 for compassionate leave (no carry-forward)', () => {
    const comp = DEFAULT_LEAVE_TYPES.find(t => t.key === 'compassionate')!
    expect(maxCarryForward(comp)).toBe(0)
  })

  it('returns the exact cap value when set to a positive number', () => {
    const cfg: LeaveTypeConfig = {
      key: 'custom', label: 'Custom', emoji: '✨', color: '#000',
      entitlementDaysFT: 10, entitlementDaysPT: 10, entitlementDaysCasual: 0,
      accrualNote: '', isActive: true, maxCarryForwardDays: 5,
    }
    expect(maxCarryForward(cfg)).toBe(5)
  })
})

// ── mergeLeaveTypes ───────────────────────────────────────────────────────────

describe('mergeLeaveTypes', () => {
  it('returns all defaults unchanged when saved list is empty', () => {
    const result = mergeLeaveTypes([])
    expect(result.length).toBe(DEFAULT_LEAVE_TYPES.length)
    expect(result.find(t => t.key === 'annual')!.entitlementDaysFT).toBe(20)
  })

  it('merges an override into the matching default entry', () => {
    const result = mergeLeaveTypes([{ key: 'annual', entitlementDaysFT: 15 }])
    const annual = result.find(t => t.key === 'annual')!
    expect(annual.entitlementDaysFT).toBe(15)
    // Other fields preserved
    expect(annual.label).toBe('Annual Leave')
    expect(annual.maxCarryForwardDays).toBeNull()
  })

  it('can deactivate a leave type', () => {
    const result = mergeLeaveTypes([{ key: 'compassionate', isActive: false }])
    expect(result.find(t => t.key === 'compassionate')!.isActive).toBe(false)
    // Others still active
    expect(result.find(t => t.key === 'annual')!.isActive).toBe(true)
  })

  it('preserves null for maxCarryForwardDays when override does not include it', () => {
    const result = mergeLeaveTypes([{ key: 'annual', entitlementDaysFT: 25 }])
    expect(result.find(t => t.key === 'annual')!.maxCarryForwardDays).toBeNull()
  })

  it('allows overriding maxCarryForwardDays to null (explicit unlimited)', () => {
    const result = mergeLeaveTypes([{ key: 'compassionate', maxCarryForwardDays: null }])
    expect(result.find(t => t.key === 'compassionate')!.maxCarryForwardDays).toBeNull()
  })

  it('allows overriding maxCarryForwardDays to a positive cap', () => {
    const result = mergeLeaveTypes([{ key: 'annual', maxCarryForwardDays: 10 }])
    expect(result.find(t => t.key === 'annual')!.maxCarryForwardDays).toBe(10)
  })

  it('ignores saved entries whose key does not match any default', () => {
    const result = mergeLeaveTypes([{ key: 'phantom', entitlementDaysFT: 99 }])
    expect(result.length).toBe(DEFAULT_LEAVE_TYPES.length)
    expect(result.find(t => t.key === 'phantom')).toBeUndefined()
  })

  it('applies multiple overrides independently', () => {
    const result = mergeLeaveTypes([
      { key: 'annual', entitlementDaysFT: 25 },
      { key: 'sick',   entitlementDaysFT: 12 },
    ])
    expect(result.find(t => t.key === 'annual')!.entitlementDaysFT).toBe(25)
    expect(result.find(t => t.key === 'sick')!.entitlementDaysFT).toBe(12)
    // Unrelated entry untouched
    expect(result.find(t => t.key === 'compassionate')!.entitlementDaysFT).toBe(2)
  })
})

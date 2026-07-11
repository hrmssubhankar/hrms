'use client'

import { useEffect, useState } from 'react'
import PermissionGate from '@/components/auth/PermissionGate'

type User = {
  id: string; email: string; role: string; isActive: boolean
  totpEnabled: boolean; lastLoginAt: string | null; createdAt: string
}

const ROLES = [
  'director', 'hr_officer', 'compliance_manager', 'operations_manager',
  'team_leader', 'payroll_officer', 'employee', 'contractor', 'auditor', 'it_admin',
]

const ROLE_STYLE: Record<string, string> = {
  director:            'bg-purple-900/50 text-purple-300 border-purple-800',
  hr_officer:          'bg-blue-900/50 text-blue-300 border-blue-800',
  compliance_manager:  'bg-amber-900/50 text-amber-300 border-amber-800',
  operations_manager:  'bg-cyan-900/50 text-cyan-300 border-cyan-800',
  team_leader:         'bg-teal-900/50 text-teal-300 border-teal-800',
  payroll_officer:     'bg-green-900/50 text-green-300 border-green-800',
  employee:            'bg-gray-800 text-gray-300 border-gray-700',
  contractor:          'bg-orange-900/50 text-orange-300 border-orange-800',
  auditor:             'bg-pink-900/50 text-pink-300 border-pink-800',
  it_admin:            'bg-red-900/50 text-red-300 border-red-800',
}

const ROLE_LABEL: Record<string, string> = {
  director: 'Director', hr_officer: 'HR Officer', compliance_manager: 'Compliance Mgr',
  operations_manager: 'Ops Manager', team_leader: 'Team Leader', payroll_officer: 'Payroll Officer',
  employee: 'Employee', contractor: 'Contractor', auditor: 'Auditor', it_admin: 'IT Admin',
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function RolesPage() {
  const [users,    setUsers]    = useState<User[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [copied,   setCopied]   = useState('')
  const [form, setForm] = useState({ email: '', role: 'employee', password: generatePassword() })

  const load = async () => {
    setLoading(true)
    const data = await fetch('/api/tenant/roles').then(r => r.json())
    setUsers(data.users ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function invite(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/tenant/roles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false); setSaving(false); load()
  }

  async function changeRole(id: string, role: string) {
    await fetch('/api/tenant/roles', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    setEditId(null); load()
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch('/api/tenant/roles', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    })
    load()
  }

  function copyPw() {
    navigator.clipboard.writeText(form.password)
    setCopied('✓ Copied!')
    setTimeout(() => setCopied(''), 2000)
  }

  const activeCount   = users.filter(u => u.isActive).length
  const inactiveCount = users.length - activeCount

  // Count by role
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Roles & Access</h1>
          <p className="text-gray-400 text-sm mt-1">Manage portal users and their access roles</p>
        </div>
        <PermissionGate permission="roles:write">
          <button onClick={() => { setShowForm(v => !v); setForm({ email: '', role: 'employee', password: generatePassword() }) }}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition">
            {showForm ? 'Cancel' : '+ Invite User'}
          </button>
        </PermissionGate>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{activeCount}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400">Suspended</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{inactiveCount}</p>
        </div>
      </div>

      {/* Role breakdown */}
      {Object.keys(roleCounts).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Breakdown by Role</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(roleCounts).map(([role, count]) => (
              <span key={role} className={`text-xs px-3 py-1 rounded-full border ${ROLE_STYLE[role] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                {ROLE_LABEL[role] ?? role} · {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Invite form */}
      {showForm && (
        <form onSubmit={invite} className="bg-gray-900 border border-purple-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-purple-300">Invite new portal user</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email *</label>
              <input required type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={INPUT}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Temporary Password</label>
              <div className="flex gap-2">
                <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`${INPUT} font-mono`} />
                <button type="button" onClick={copyPw}
                  className="shrink-0 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg transition">
                  {copied || 'Copy'}
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                  className="shrink-0 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg transition">
                  ↺
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">Share this password with the user — they should change it after first login.</p>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg">
            {saving ? 'Inviting…' : 'Create User'}
          </button>
        </form>
      )}

      {/* User table */}
      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : users.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <p className="text-4xl mb-3">🔑</p>
          <p className="text-gray-300 font-medium">No portal users yet</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Email', 'Role', '2FA', 'Last Login', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-800/30 ${!u.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-gray-200 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <PermissionGate permission="roles:write"
                      fallback={
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_STYLE[u.role] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      }>
                      {editId === u.id ? (
                        <div className="flex gap-1.5">
                          <select value={editRole} onChange={e => setEditRole(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
                          </select>
                          <button onClick={() => changeRole(u.id, editRole)}
                            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition">✓</button>
                          <button onClick={() => setEditId(null)}
                            className="text-xs text-gray-500 hover:text-white px-1">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditId(u.id); setEditRole(u.role) }}
                          className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition ${ROLE_STYLE[u.role] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </button>
                      )}
                    </PermissionGate>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${u.totpEnabled ? 'text-green-400' : 'text-gray-600'}`}>
                      {u.totpEnabled ? '🔒 On' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-AU') : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${u.isActive ? 'bg-green-900/50 text-green-300 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PermissionGate permission="roles:write">
                      <button onClick={() => toggleActive(u.id, !u.isActive)}
                        className={`text-xs px-2.5 py-1 rounded border transition ${u.isActive
                          ? 'bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/40'
                          : 'bg-green-900/20 border-green-800 text-green-400 hover:bg-green-900/40'}`}>
                        {u.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

type Admin = {
  id: string
  name: string
  email: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export default function AdminsPage() {
  const [admins, setAdmins]   = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/super-admin/admins')
      .then(r => r.json())
      .then(d => { setAdmins(d.admins ?? []); setLoading(false) })
  }, [])

  async function toggleActive(admin: Admin) {
    await fetch('/api/super-admin/admins', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: admin.id, isActive: !admin.isActive }),
    })
    setAdmins(a => a.map(x => x.id === admin.id ? { ...x, isActive: !x.isActive } : x))
  }

  async function deleteAdmin(admin: Admin) {
    if (!confirm(`Remove "${admin.name}" (${admin.email}) as super admin? This cannot be undone.`)) return
    await fetch('/api/super-admin/admins', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: admin.id }),
    })
    setAdmins(a => a.filter(x => x.id !== admin.id))
  }

  if (loading) return <div className="text-gray-400">Loading…</div>

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Super Admins</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-level administrator accounts</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Admin</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Last Login</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Added</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center text-purple-200 text-xs font-bold shrink-0">
                      {a.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{a.name}</p>
                      <p className="text-gray-400 text-xs">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => toggleActive(a)}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition ${
                      a.isActive
                        ? 'bg-green-900 text-green-300 hover:bg-red-900 hover:text-red-300'
                        : 'bg-red-900 text-red-300 hover:bg-green-900 hover:text-green-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${a.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                    {a.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">
                  {a.lastLoginAt
                    ? new Date(a.lastLoginAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Never'}
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">
                  {new Date(a.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3.5">
                  {admins.length > 1 ? (
                    <button
                      onClick={() => deleteAdmin(a)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium"
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="text-xs text-gray-600">Last admin</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-xs text-amber-300">
        ⚠️ The last remaining admin cannot be deleted.
      </div>
    </div>
  )
}

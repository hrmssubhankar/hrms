'use client'

import { useEffect, useState } from 'react'

type Announcement = {
  id: string
  title: string
  body: string
  priority: 'info' | 'warning' | 'critical'
  targetTenants: 'all' | string[]
  expiresAt: string | null
  createdAt: number
  createdBy: string
  isActive: boolean
}

const PRIORITY_STYLES = {
  info:     { badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200',   icon: 'ℹ️',  border: 'border-blue-800' },
  warning:  { badge: 'bg-yellow-900 text-yellow-200', icon: '️',  border: 'border-yellow-800' },
  critical: { badge: 'bg-red-900 text-red-200',      icon: '', border: 'border-red-800' },
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [saving, setSaving]               = useState(false)
  const [form, setForm] = useState({
    title: '', body: '', priority: 'info', targetTenants: 'all', expiresAt: '',
  })

  function load() {
    setLoading(true)
    fetch('/api/super-admin/announcements')
      .then(r => r.json())
      .then(d => { setAnnouncements(d.announcements ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function createAnnouncement() {
    if (!form.title || !form.body) return
    setSaving(true)
    await fetch('/api/super-admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        expiresAt: form.expiresAt || null,
      }),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ title: '', body: '', priority: 'info', targetTenants: 'all', expiresAt: '' })
    load()
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch('/api/super-admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !current }),
    })
    setAnnouncements(a => a.map(x => x.id === id ? { ...x, isActive: !current } : x))
  }

  async function deleteAnn(id: string) {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/super-admin/announcements?id=${id}`, { method: 'DELETE' })
    setAnnouncements(a => a.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Announcements</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Broadcast messages to all tenants or specific clients</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancel' : '+ New Announcement'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-purple-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-purple-300">New Announcement</h2>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Scheduled Maintenance on 15 Aug"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Message *</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={3}
              placeholder="Enter the message all tenants will see…"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
              >
                <option value="info">ℹ️ Info</option>
                <option value="warning">️ Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Audience</label>
              <select
                value={form.targetTenants}
                onChange={e => setForm(f => ({ ...f, targetTenants: e.target.value }))}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Tenants</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Expires (optional)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={createAnnouncement}
              disabled={saving || !form.title || !form.body}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
            >
              {saving ? 'Sending…' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      )}

      {/* Announcements list */}
      {loading ? (
        <div className="text-gray-600 dark:text-gray-400 text-sm">Loading…</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <div className="text-5xl mb-3"></div>
          <p className="text-gray-600 dark:text-gray-400">No announcements yet</p>
          <p className="text-gray-600 text-sm mt-1 dark:text-gray-400">Create one to broadcast a message to all tenants</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const p = PRIORITY_STYLES[ann.priority as keyof typeof PRIORITY_STYLES] ?? PRIORITY_STYLES.info
            return (
              <div
                key={ann.id}
                className={`bg-white dark:bg-gray-900 border rounded-xl p-5 ${p.border} ${!ann.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">{ann.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.badge}`}>{ann.priority}</span>
                        {!ann.isActive && (
                          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          → {ann.targetTenants === 'all' ? 'All tenants' : ann.targetTenants}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{ann.body}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>By {ann.createdBy}</span>
                        <span>{new Date(ann.createdAt).toLocaleString('en-AU')}</span>
                        {ann.expiresAt && <span>Expires {new Date(ann.expiresAt).toLocaleDateString('en-AU')}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(ann.id, ann.isActive)}
                      className={`text-xs px-3 py-1 rounded-lg border transition ${
                        ann.isActive
                          ? 'border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-600 hover:text-red-400'
                          : 'border-green-700 text-green-400 hover:bg-green-900/30'
                      }`}
                    >
                      {ann.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteAnn(ann.id)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

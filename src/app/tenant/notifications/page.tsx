'use client'

import { useEffect, useState } from 'react'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

type AlertResult = {
  ok: boolean
  scanned: number
  sent: number
  failed: number
  details: { sent: string[]; failed: string[] }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]             = useState(true)
  const [running, setRunning]             = useState(false)
  const [daysAhead, setDaysAhead]         = useState(7)
  const [result, setResult]               = useState<AlertResult | null>(null)
  const [error, setError]                 = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/tenant/notifications')
    if (res.ok) {
      const d = await res.json()
      setNotifications(d.notifications ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markAllRead() {
    await fetch('/api/tenant/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    load()
  }

  async function markRead(id: string) {
    await fetch('/api/tenant/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
  }

  async function runExpiryCheck() {
    setRunning(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/tenant/notifications/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAhead }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Failed'); return }
      setResult(d)
    } catch { setError('Request failed') }
    finally { setRunning(false) }
  }

  const unread = notifications.filter(n => !n.isRead).length

  const TYPE_ICON: Record<string, string> = {
    document_expiry: '📄',
    payslip:         '💰',
    onboarding:      '🎉',
    compliance:      '🔒',
    general:         '🔔',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔔 Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition underline underline-offset-2">
            Mark all read
          </button>
        )}
      </div>

      {/* Email Alert Panel */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1">📧 Document Expiry Alerts</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Scan for compliance documents expiring soon and email employees + compliance managers.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notify if expiring within</label>
          <select value={daysAhead} onChange={e => setDaysAhead(Number(e.target.value))}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white">
            {[3, 7, 14, 30].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-300 mb-3">{error}</div>
        )}

        {result && (
          <div className={`rounded-xl p-4 mb-4 border ${result.sent > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {result.sent > 0 ? '✅ Alerts sent' : 'ℹ️ Scan complete'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Scanned <strong>{result.scanned}</strong> expiring document{result.scanned !== 1 ? 's' : ''} ·
              <strong className="text-green-600 dark:text-green-400"> {result.sent}</strong> email{result.sent !== 1 ? 's' : ''} sent
              {result.failed > 0 && <span className="text-red-400"> · {result.failed} failed</span>}
            </p>
            {result.details.sent.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {result.details.sent.map((s, i) => (
                  <li key={i} className="text-xs text-gray-500 dark:text-gray-400">✓ {s}</li>
                ))}
              </ul>
            )}
            {result.details.failed.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {result.details.failed.map((s, i) => (
                  <li key={i} className="text-xs text-red-400">✗ {s}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button onClick={runExpiryCheck} disabled={running}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 hover:opacity-90"
          style={{ background: 'var(--primary)' }}>
          {running ? 'Scanning & sending…' : `🔍 Run expiry check (${daysAhead} days)`}
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          💡 To automate this daily, add <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">vercel.json</code> with a cron job — see setup guide below.
        </p>
      </div>

      {/* Cron Setup Hint */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">⏰ Automate with Vercel Cron</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Add this to <code>vercel.json</code> in your project root to run expiry alerts every day at 7am UTC:</p>
        <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">{`{
  "crons": [
    {
      "path": "/api/tenant/notifications/send",
      "schedule": "0 7 * * *"
    }
  ]
}`}</pre>
        <p className="text-xs text-gray-400 mt-2">Also add <code>RESEND_API_KEY</code>, <code>RESEND_FROM</code>, and <code>APP_URL</code> to your Vercel environment variables.</p>
      </div>

      {/* In-app Notifications */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">In-app Notifications</h2>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map(n => (
              <li key={n.id}
                className={`flex gap-3 px-5 py-4 transition ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-AU')}</p>
                </div>
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)}
                    className="shrink-0 text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition mt-1">
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

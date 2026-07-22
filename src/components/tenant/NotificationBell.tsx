'use client'

import { useEffect, useRef, useState } from 'react'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  isRead: boolean
  link: string | null
  createdAt: string
}

// Colour dot per notification type (replaces emoji)
const TYPE_COLOUR: Record<string, string> = {
  leave:       'bg-sky-500',
  compliance:  'bg-red-500',
  onboarding:  'bg-green-500',
  payroll:     'bg-amber-500',
  document:    'bg-blue-500',
  training:    'bg-purple-500',
  performance: 'bg-indigo-500',
  system:      'bg-gray-500',
}

export default function NotificationBell({ primaryColor }: { primaryColor: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen]   = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    setLoading(true)
    fetch('/api/tenant/notifications')
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    await fetch('/api/tenant/notifications', { method: 'PATCH' })
    setNotifications(n => n.map(x => ({ ...x, isRead: true })))
  }

  async function markRead(id: string) {
    await fetch('/api/tenant/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        aria-label="Notifications"
      >
        {/* Bell SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            style={{ background: primaryColor }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">Loading…</p>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : notifications.map(n => (
              <button
                key={n.id}
                onClick={() => { markRead(n.id); setOpen(false) }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-2 ${TYPE_COLOUR[n.type] ?? 'bg-gray-400'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-gray-400 mt-0.5 truncate">{n.body}</p>}
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: primaryColor }} />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-center">
            <button className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">View all notifications</button>
          </div>
        </div>
      )}
    </div>
  )
}

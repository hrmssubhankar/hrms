'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Props = {
  name: string
  email: string
}

export default function AdminDropdown({ name, email }: Props) {
  const [open, setOpen]   = useState(false)
  const [loading, setLoading] = useState(false)
  const ref               = useRef<HTMLDivElement>(null)
  const router            = useRouter()

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function logout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
      >
        <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <span className="text-sm text-white font-medium hidden sm:block">{name}</span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Identity */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
            <span className="inline-block mt-1 text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full font-medium">
              Super Admin
            </span>
          </div>

          {/* Actions */}
          <div className="py-1">
            <Link
              href="/super-admin/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
            >
              <span>⚙️</span> Settings
            </Link>
          </div>

          <div className="border-t border-gray-800 py-1">
            <button
              onClick={logout}
              disabled={loading}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition disabled:opacity-60"
            >
              <span>→</span> {loading ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'

type Holiday = {
  id: string
  name: string
  date: string
  country: string
  state: string | null
  isNational: boolean
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function fmt(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const d     = new Date(dateStr + 'T00:00:00')
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

export default function PublicHolidaysPage() {
  const currentYear = new Date().getFullYear()
  const [year,     setYear]     = useState(currentYear)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async (y: number) => {
    setLoading(true)
    const res  = await fetch(`/api/tenant/public-holidays?year=${y}`)
    const data = await res.json()
    setHolidays(data.holidays ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load(year) }, [year, load])

  // Group by month
  const byMonth: Record<number, Holiday[]> = {}
  for (const h of holidays) {
    const m = new Date(h.date + 'T00:00:00').getMonth()
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(h)
  }

  const nextHoliday = holidays.find(h => daysUntil(h.date) >= 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">🇦🇺 Public Holidays</h1>
          <p className="text-sm text-gray-400 mt-0.5">Australian national public holidays</p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear(y => y - 1)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
          >
            ←
          </button>
          <span className="px-4 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-semibold min-w-[80px] text-center">
            {year}
          </span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Next holiday banner */}
      {nextHoliday && year === currentYear && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-xl px-5 py-4 flex items-center gap-4">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="text-xs text-purple-400 font-medium uppercase tracking-wider">Next Public Holiday</p>
            <p className="text-white font-semibold">{nextHoliday.name}</p>
            <p className="text-sm text-gray-400">
              {fmt(nextHoliday.date)}
              {daysUntil(nextHoliday.date) === 0
                ? ' — Today!'
                : daysUntil(nextHoliday.date) === 1
                ? ' — Tomorrow!'
                : ` — in ${daysUntil(nextHoliday.date)} days`}
            </p>
          </div>
        </div>
      )}

      {/* Holiday list */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading…</div>
      ) : holidays.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-gray-700">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-400 font-medium">No public holidays found for {year}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byMonth)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([monthIdx, monthHolidays]) => {
              const m = Number(monthIdx)
              const isPast = new Date(year, m + 1, 1) < new Date()
              return (
                <div key={m}>
                  <h2 className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isPast ? 'text-gray-600' : 'text-purple-400'}`}>
                    {MONTHS[m]}
                  </h2>
                  <div className="space-y-2">
                    {monthHolidays.map(h => {
                      const diff   = daysUntil(h.date)
                      const isToday  = diff === 0
                      const isPastH  = diff < 0
                      return (
                        <div
                          key={h.id}
                          className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-colors ${
                            isToday
                              ? 'bg-purple-900/40 border-purple-600'
                              : isPastH
                              ? 'bg-gray-800/30 border-gray-800 opacity-50'
                              : 'bg-gray-800/60 border-gray-700'
                          }`}
                        >
                          {/* Date block */}
                          <div className="text-center w-14 shrink-0">
                            <p className="text-xs text-gray-500 uppercase">
                              {new Date(h.date + 'T00:00:00').toLocaleDateString('en-AU', { month: 'short' })}
                            </p>
                            <p className={`text-2xl font-bold leading-none ${isToday ? 'text-purple-300' : isPastH ? 'text-gray-600' : 'text-white'}`}>
                              {new Date(h.date + 'T00:00:00').getDate()}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(h.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short' })}
                            </p>
                          </div>

                          {/* Name + badges */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${isPastH ? 'text-gray-600' : 'text-white'}`}>{h.name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800">
                                🇦🇺 Australia
                              </span>
                              {h.isNational && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400 border border-blue-800">
                                  National
                                </span>
                              )}
                              {h.state && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 border border-gray-600">
                                  {h.state}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Countdown */}
                          <div className="text-right shrink-0">
                            {isToday ? (
                              <span className="text-xs font-semibold text-purple-300">Today 🎉</span>
                            ) : isPastH ? (
                              <span className="text-xs text-gray-600">Passed</span>
                            ) : diff === 1 ? (
                              <span className="text-xs text-yellow-400">Tomorrow</span>
                            ) : (
                              <span className="text-xs text-gray-500">{diff}d away</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      <p className="text-xs text-gray-600 pt-2">
        Dates reflect national observed holidays. Some states may observe additional or substituted dates.
      </p>
    </div>
  )
}

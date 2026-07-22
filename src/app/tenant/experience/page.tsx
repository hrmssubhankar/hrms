'use client'

import { useState, useEffect } from 'react'

type Employee = { id:string; firstName:string; lastName:string; startDate:string; isActive:boolean }

function tenure(startDate: string) {
  const ms  = Date.now() - new Date(startDate).getTime()
  const yrs = Math.floor(ms / (365.25 * 86400000))
  const mos = Math.floor((ms % (365.25 * 86400000)) / (30.44 * 86400000))
  return yrs > 0 ? `${yrs}y ${mos}m` : `${mos} months`
}

const MILESTONES = [3, 6, 12, 24, 36, 60]

export default function ExperiencePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch('/api/tenant/employees?limit=200&status=active').then(r=>r.json()).then(d=>{
      setEmployees(d.employees??[])
      setLoading(false)
    })
  }, [])

  const withTenure = employees
    .filter(e => e.isActive && e.startDate)
    .map(e => {
      const ms  = Date.now() - new Date(e.startDate).getTime()
      const mos = Math.floor(ms / (30.44 * 86400000))
      return { ...e, tenureMonths: mos }
    })
    .sort((a, b) => b.tenureMonths - a.tenureMonths)

  const upcoming = withTenure.filter(e => {
    const nextMilestone = MILESTONES.find(m => m > e.tenureMonths)
    return nextMilestone && (nextMilestone - e.tenureMonths) <= 2
  })

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-900">Employee Experience</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tenure milestones and workforce longevity</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Upcoming milestones */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Upcoming Milestones (within 2 months)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcoming.map(e => {
                const next = MILESTONES.find(m => m > e.tenureMonths)!
                const label = next >= 12 ? `${next/12} year${next/12>1?'s':''}` : `${next} months`
                return (
                  <div key={e.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl"></span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.firstName} {e.lastName}</p>
                      <p className="text-xs text-amber-700">{label} milestone approaching!</p>
                      <p className="text-xs text-gray-500">Currently: {tenure(e.startDate)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tenure table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Tenure Overview</h2>
            <p className="text-xs text-gray-400">{withTenure.length} active employees</p>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Start Date</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tenure</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Milestone</th>
            </tr></thead>
            <tbody>
              {withTenure.map(e => {
                const achieved = MILESTONES.filter(m => m <= e.tenureMonths)
                const lastMilestone = achieved.at(-1)
                return (
                  <tr key={e.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{e.firstName} {e.lastName}</td>
                    <td className="px-5 py-3 text-gray-600">{new Date(e.startDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-gray-700 font-medium">{tenure(e.startDate)}</td>
                    <td className="px-5 py-3">
                      {lastMilestone ? (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          {lastMilestone>=12 ? `${lastMilestone/12}yr` : `${lastMilestone}mo`} </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

type Summary = { totalActive:number; fullTime:number; partTime:number; casual:number; contractor:number; departments:number; positions:number }
type DeptRow  = { id:string; name:string; count:number; positions:number }
type Position = { id:string; title:string; departmentId:string|null; isActive:boolean }

export default function WorkforcePage() {
  const [summary, setSummary]   = useState<Summary | null>(null)
  const [depts, setDepts]       = useState<DeptRow[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/tenant/workforce').then(r => r.json()).then(d => {
      setSummary(d.summary ?? null)
      setDepts(d.headcountByDepartment ?? [])
      setPositions(d.positions ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-900">Workforce Planning</h1>
        <p className="text-sm text-gray-500 mt-0.5">Headcount overview, departments, and positions</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label:'Active Employees', value:summary.totalActive, cls:'text-brand-600' },
              { label:'Full-time', value:summary.fullTime, cls:'text-gray-900' },
              { label:'Part-time', value:summary.partTime, cls:'text-gray-900' },
              { label:'Casual', value:summary.casual, cls:'text-gray-900' },
              { label:'Contractor', value:summary.contractor, cls:'text-gray-900' },
              { label:'Departments', value:summary.departments, cls:'text-gray-900' },
              { label:'Positions', value:summary.positions, cls:'text-gray-900' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Headcount by department */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Headcount by Department</h2>
          </div>
          {depts.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">No departments configured</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Active Staff</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Positions</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vacancies</th>
              </tr></thead>
              <tbody>
                {depts.map(d => (
                  <tr key={d.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{d.name}</td>
                    <td className="px-5 py-3 text-gray-700">{d.count}</td>
                    <td className="px-5 py-3 text-gray-700">{d.positions}</td>
                    <td className="px-5 py-3">
                      {d.positions > d.count ? (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">{d.positions - d.count} open</span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Positions */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">All Positions</h2>
          </div>
          {positions.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">No positions defined</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
              {positions.map(p => (
                <div key={p.id} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{depts.find(d => d.id === p.departmentId)?.name ?? 'Unassigned'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

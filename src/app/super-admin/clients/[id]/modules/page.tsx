'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Module = { id: number; name: string; isEnabled: boolean; moduleName?: string; moduleId?: number }

const MODULE_CATEGORIES: Record<string, number[]> = {
  'Core':        [1, 2, 3, 4, 5],
  'Compliance':  [6, 7, 8, 9],
  'Learning':    [10, 11, 12],
  'Talent':      [13, 14, 15],
  'Performance': [16],
  'Safety':      [17, 18, 19],
  'Intelligence':[20],
  'Experience':  [21, 22, 23, 24, 25],
  'Operations':  [26, 27, 28],
}

export default function ModulesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [tenantName, setTenantName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/super-admin/clients/${id}`).then(r => r.json()),
      fetch(`/api/super-admin/clients/${id}/modules`).then(r => r.json()),
    ]).then(([clientData, modData]) => {
      setTenantName(clientData.tenant?.name ?? '')
      setModules(modData.modules?.map((m: any) => ({
        id: m.moduleId,
        name: m.moduleName,
        isEnabled: m.isEnabled,
      })) ?? [])
      setLoading(false)
    })
  }, [id])

  function toggle(moduleId: number) {
    setModules(m => m.map(x => x.id === moduleId ? { ...x, isEnabled: !x.isEnabled } : x))
  }

  function selectAll(category: string) {
    const ids = MODULE_CATEGORIES[category]
    setModules(m => m.map(x => ids.includes(x.id) ? { ...x, isEnabled: true } : x))
  }

  function deselectAll(category: string) {
    const ids = MODULE_CATEGORIES[category]
    // Core modules (1-5) can't be disabled
    setModules(m => m.map(x => ids.includes(x.id) && x.id > 5 ? { ...x, isEnabled: false } : x))
  }

  async function saveModules() {
    setSaving(true)
    await fetch(`/api/super-admin/clients/${id}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modules: modules.map(m => ({ moduleId: m.id, isEnabled: m.isEnabled })) }),
    })
    setSaving(false)
    router.push(`/super-admin/clients/${id}/theme`)
  }

  if (loading) return <div className="text-gray-400">Loading modules…</div>

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Module Configuration</h1>
        <p className="text-gray-400 text-sm mt-1">
          Enable or disable modules for <span className="text-purple-300 font-medium">{tenantName}</span>.
          Changes take effect immediately — no redeployment needed.
        </p>
      </div>

      <div className="space-y-5">
        {Object.entries(MODULE_CATEGORIES).map(([category, ids]) => {
          const catModules = modules.filter(m => ids.includes(m.id))
          const allOn = catModules.every(m => m.isEnabled)
          const allOff = catModules.every(m => !m.isEnabled)
          const isCore = category === 'Core'

          return (
            <div key={category} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                <span className="text-sm font-semibold text-white">{category}</span>
                {!isCore && (
                  <div className="flex gap-2">
                    <button onClick={() => selectAll(category)} className="text-xs text-green-400 hover:underline">All On</button>
                    <button onClick={() => deselectAll(category)} className="text-xs text-red-400 hover:underline">All Off</button>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-800">
                {catModules.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <span className="text-sm text-white">{m.name}</span>
                      {isCore && <span className="ml-2 text-xs text-gray-500">(always on)</span>}
                    </div>
                    <button
                      onClick={() => !isCore && toggle(m.id)}
                      disabled={isCore}
                      className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none ${
                        m.isEnabled ? 'bg-purple-600' : 'bg-gray-700'
                      } ${isCore ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                          m.isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={saveModules}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition"
        >
          {saving ? 'Saving…' : 'Save & Configure Theme →'}
        </button>
        <button
          onClick={() => router.push('/super-admin/clients')}
          className="border border-gray-700 text-gray-300 hover:text-white text-sm px-4 py-2.5 rounded-lg transition"
        >
          Done
        </button>
      </div>
    </div>
  )
}

'use client'

/**
 * Drop-in export button.
 *
 * Usage:
 *   <ExportButton onClick={handleExport} disabled={loading} />
 *   <ExportButton onClick={handleExport} label="Export CSV" count={employees.length} />
 */

import { useState } from 'react'

type Props = {
  onClick: () => void | Promise<void>
  label?: string
  count?: number
  disabled?: boolean
  className?: string
}

export default function ExportButton({
  onClick,
  label = 'Export CSV',
  count,
  disabled,
  className = '',
}: Props) {
  const [exporting, setExporting] = useState(false)

  async function handleClick() {
    if (exporting || disabled) return
    setExporting(true)
    try {
      await onClick()
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || exporting}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${className}`}
      title={count !== undefined ? `Export ${count} rows to CSV` : 'Export to CSV'}
    >
      <span className="text-[11px]">⬇</span>
      {exporting ? 'Exporting…' : label}
      {!exporting && count !== undefined && (
        <span className="text-[10px] opacity-60">({count})</span>
      )}
    </button>
  )
}

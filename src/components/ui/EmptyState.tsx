'use client'

import Icon, { type IconName } from '@/components/ui/Icon'

/**
 * Consistent empty state for tables and lists.
 *
 * Usage:
 *   {items.length === 0 && !loading && (
 *     <EmptyState
 *       icon="clipboard-list"
 *       title="No records found"
 *       message="Add your first record to get started."
 *       action={{ label: 'Add Record', onClick: () => setShowForm(true) }}
 *     />
 *   )}
 */

type EmptyStateProps = {
  icon?: IconName
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  /** Use 'table' when rendering inside a <tbody> */
  as?: 'div' | 'table'
  cols?: number
}

export default function EmptyState({
  icon = 'document',
  title,
  message,
  action,
  as: variant = 'div',
  cols = 1,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <Icon name={icon} className="w-10 h-10 opacity-40 mb-4" />}
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      {message && (
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">{message}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )

  if (variant === 'table') {
    return (
      <tr>
        <td colSpan={cols} className="text-center">
          {content}
        </td>
      </tr>
    )
  }

  return content
}

import { Trash2 } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStoreNew'

interface PapersTableProps {
  configId: string
  showPercentage: boolean
}

export function PapersTable({ configId, showPercentage }: PapersTableProps) {
  const { getTableRows, getConfig, deleteEntry } = usePapersStore()
  
  const config = getConfig(configId)
  const rows = getTableRows(configId)

  if (!config) return null

  const paperConfigs = config.papers || []

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this entry?')) {
      await deleteEntry(id)
    }
  }

  const formatPaperCode = (code: string) => {
    const paper = code[0]
    const variant = code[1] || '1'
    return `P${paper}V${variant}`
  }

  const getPercentageColor = (percentage: number | null) => {
    if (percentage === null) return ''
    if (percentage >= 90) return 'text-green-600 dark:text-green-400'
    if (percentage >= 80) return 'text-green-500 dark:text-green-500'
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400'
    if (percentage >= 60) return 'text-yellow-500 dark:text-yellow-500'
    return 'text-red-500 dark:text-red-400'
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No entries yet. Add your first paper entry to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Session
              </th>
              {paperConfigs.map(pc => (
                <th 
                  key={pc.paper}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Paper {pc.paper}
                  <span className="block text-[10px] font-normal normal-case">
                    /{pc.max_marks}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total
              </th>
              {showPercentage && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  %
                </th>
              )}
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.map((row) => (
              <tr 
                key={`${row.year}-${row.session}`}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                {/* Session */}
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {row.sessionLabel}
                  </div>
                  <div className="text-xs text-gray-500">{row.session}</div>
                </td>

                {/* Paper columns */}
                {paperConfigs.map(pc => {
                  const entry = row.papers.get(pc.paper)
                  return (
                    <td key={pc.paper} className="px-4 py-3 text-center">
                      {entry ? (
                        <div className="relative group/cell">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {entry.marks ?? '—'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPaperCode(entry.paper_code)}
                          </div>
                          {/* Delete button on hover */}
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="absolute -top-1 -right-1 p-1 bg-red-100 dark:bg-red-900/50 rounded-full opacity-0 group-hover/cell:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                  )
                })}

                {/* Total */}
                <td className="px-4 py-3 text-center">
                  {row.total != null ? (
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {row.total}
                      </span>
                      <span className="text-xs text-gray-500">/{row.maxTotal}</span>
                    </div>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                  )}
                </td>

                {/* Percentage */}
                {showPercentage && (
                  <td className="px-4 py-3 text-center">
                    {row.percentage != null ? (
                      <span className={`font-bold ${getPercentageColor(row.percentage)}`}>
                        {row.percentage}%
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>
                )}

                {/* Row actions */}
                <td className="px-4 py-3">
                  {/* Empty for now - individual delete is on cells */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

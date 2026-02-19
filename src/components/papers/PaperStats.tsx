import { FileText, CheckCircle, Clock, Target } from 'lucide-react'

interface PaperStatsProps {
  total: number
  solved: number
  inProgress: number
  unsolved: number
  averagePercentage: number
}

export function PaperStats({ total, solved, inProgress, unsolved, averagePercentage }: PaperStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        icon={FileText}
        label="Total Papers"
        value={total.toString()}
        color="blue"
      />
      <StatCard
        icon={CheckCircle}
        label="Solved"
        value={solved.toString()}
        color="green"
      />
      <StatCard
        icon={Clock}
        label="In Progress"
        value={inProgress.toString()}
        color="yellow"
      />
      <StatCard
        icon={Target}
        label="Unsolved"
        value={unsolved.toString()}
        color="gray"
      />
      <StatCard
        icon={Target}
        label="Avg Score"
        value={averagePercentage > 0 ? `${Math.round(averagePercentage)}%` : '—'}
        color="purple"
      />
    </div>
  )
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string
  color: 'blue' | 'green' | 'yellow' | 'gray' | 'purple'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    icon: 'text-gray-600 dark:text-gray-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
  },
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colors = colorClasses[color]
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

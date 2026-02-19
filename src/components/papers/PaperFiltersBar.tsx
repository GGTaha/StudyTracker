import { Search, ChevronDown, X, SortAsc, SortDesc } from 'lucide-react'
import type { PaperFilters, PaperStatus } from '../../stores/papersStore'
import type { Subject } from '../../stores/timerStore'

interface PaperFiltersBarProps {
  filters: PaperFilters
  subjects: Subject[]
  years: number[]
  onFilterChange: (filters: Partial<PaperFilters>) => void
  onReset: () => void
}

const SESSIONS = ['Feb/Mar', 'May/Jun', 'Oct/Nov']
const STATUS_OPTIONS: { value: PaperStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'solved', label: 'Solved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'unsolved', label: 'Unsolved' },
]

const SORT_OPTIONS: { value: PaperFilters['sortBy']; label: string }[] = [
  { value: 'date_added', label: 'Date Added' },
  { value: 'name', label: 'Name' },
  { value: 'year', label: 'Year' },
  { value: 'last_attempt', label: 'Last Attempt' },
  { value: 'percentage', label: 'Score' },
]

export function PaperFiltersBar({ filters, subjects, years, onFilterChange, onReset }: PaperFiltersBarProps) {
  const hasActiveFilters = 
    filters.subjectId || 
    filters.status !== 'all' || 
    filters.year || 
    filters.session || 
    filters.searchQuery

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-4">
      {/* Search and Clear */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search papers..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {/* Subject Filter */}
        <FilterSelect
          value={filters.subjectId || ''}
          onChange={(value) => onFilterChange({ subjectId: value || null })}
          placeholder="Subject"
          isActive={!!filters.subjectId}
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </FilterSelect>

        {/* Status Filter */}
        <FilterSelect
          value={filters.status}
          onChange={(value) => onFilterChange({ status: value as PaperStatus | 'all' })}
          placeholder="Status"
          isActive={filters.status !== 'all'}
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        {/* Year Filter */}
        <FilterSelect
          value={filters.year?.toString() || ''}
          onChange={(value) => onFilterChange({ year: value ? parseInt(value) : null })}
          placeholder="Year"
          isActive={!!filters.year}
        >
          <option value="">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </FilterSelect>

        {/* Session Filter */}
        <FilterSelect
          value={filters.session || ''}
          onChange={(value) => onFilterChange({ session: value || null })}
          placeholder="Session"
          isActive={!!filters.session}
        >
          <option value="">All Sessions</option>
          {SESSIONS.map(session => (
            <option key={session} value={session}>{session}</option>
          ))}
        </FilterSelect>

        <div className="flex-1" />

        {/* Sort */}
        <div className="flex items-center gap-2">
          <FilterSelect
            value={filters.sortBy}
            onChange={(value) => onFilterChange({ sortBy: value as PaperFilters['sortBy'] })}
            placeholder="Sort by"
            isActive={false}
            className="min-w-[140px]"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
          
          <button
            onClick={() => onFilterChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={filters.sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4 text-gray-500" />
            ) : (
              <SortDesc className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  isActive: boolean
  className?: string
  children: React.ReactNode
}

function FilterSelect({ value, onChange, isActive, className = '', children }: FilterSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-8 py-2 rounded-lg border text-sm cursor-pointer ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

import { Tag, ChevronDown, Plus, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { SessionTag } from '../../stores/timerStore'

interface TagPickerProps {
  tags: SessionTag[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAddTag: (name: string, color?: string) => void
  disabled?: boolean
}

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#6B7280', '#84CC16', '#F97316'
]

export function TagPicker({ 
  tags, 
  selectedId, 
  onSelect, 
  onAddTag,
  disabled 
}: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedTag = tags.find(t => t.id === selectedId)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowAddForm(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAdd = () => {
    if (newName.trim()) {
      onAddTag(newName.trim(), newColor)
      setNewName('')
      setNewColor(PRESET_COLORS[0])
      setShowAddForm(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all w-full ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        {selectedTag ? (
          <>
            <div 
              className="w-4 h-4 rounded flex-shrink-0" 
              style={{ backgroundColor: selectedTag.color }}
            />
            <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
              {selectedTag.name}
            </span>
          </>
        ) : (
          <>
            <Tag className="w-5 h-5 text-gray-400" />
            <span className="flex-1 text-left text-gray-500 dark:text-gray-400">
              Select tag (optional)
            </span>
          </>
        )}
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* No tag option */}
          <button
            onClick={() => { onSelect(null); setIsOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              !selectedId ? 'bg-gray-50 dark:bg-gray-700' : ''
            }`}
          >
            <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600" />
            <span className="text-gray-600 dark:text-gray-300">No tag</span>
          </button>

          {/* Tag list */}
          <div className="max-h-48 overflow-y-auto">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => { onSelect(tag.id); setIsOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedId === tag.id ? 'bg-gray-50 dark:bg-gray-700' : ''
                }`}
              >
                <div 
                  className="w-4 h-4 rounded flex-shrink-0" 
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                  {tag.name}
                </span>
                {tag.is_default && (
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    Default
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Add new tag */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center gap-2 px-4 py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add custom tag
              </button>
            ) : (
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Tag name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Color:</span>
                  <div className="flex gap-1 flex-wrap">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewColor(color)}
                        className={`w-6 h-6 rounded transition-transform ${
                          newColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

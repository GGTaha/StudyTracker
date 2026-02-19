import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
}

interface CustomDropdownProps {
  value: string | null
  onChange: (val: string) => void
  options: DropdownOption[]
  icon: React.ElementType
  iconColorClass?: string
  placeholder?: string
}

export function CustomDropdown({ value, onChange, options, icon: Icon, iconColorClass = "text-slate-400", placeholder }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(o => o.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative flex-1 group w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-full pl-5 pr-4 py-3 text-slate-200 outline-none hover:bg-white/[0.06] transition-colors font-medium text-sm backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className={iconColorClass} />
          <span className={!selectedOption ? "text-slate-400" : ""}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div 
        className={`absolute top-full left-0 right-0 mt-2 bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 transition-all duration-200 origin-top ${isOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none'}`}
      >
        <div className="max-h-[200px] overflow-y-auto hide-scrollbar py-2">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              className={`px-4 py-3 text-sm cursor-pointer transition-colors ${value === opt.value ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

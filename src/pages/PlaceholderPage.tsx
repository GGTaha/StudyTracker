import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
        <Construction className="w-10 h-10 text-blue-600 dark:text-blue-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">
        {description}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
        Coming in Phase 2
      </p>
    </div>
  )
}

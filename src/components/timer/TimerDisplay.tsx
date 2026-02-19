interface TimerDisplayProps {
  seconds: number
  isRunning: boolean
  isPaused: boolean
}

export function TimerDisplay({ seconds, isRunning, isPaused }: TimerDisplayProps) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const formatNumber = (num: number) => num.toString().padStart(2, '0')

  return (
    <div className="text-center">
      <div className="relative">
        {/* Glow effect when running */}
        {isRunning && !isPaused && (
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
        )}
        
        <div className={`relative font-mono text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight ${
          isRunning && !isPaused 
            ? 'text-blue-600 dark:text-blue-400' 
            : isPaused 
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-gray-900 dark:text-white'
        }`}>
          <span>{formatNumber(hours)}</span>
          <span className={`${isRunning && !isPaused ? 'animate-pulse' : ''}`}>:</span>
          <span>{formatNumber(minutes)}</span>
          <span className={`${isRunning && !isPaused ? 'animate-pulse' : ''}`}>:</span>
          <span>{formatNumber(secs)}</span>
        </div>
      </div>
      
      {/* Status text */}
      <div className="mt-4 text-lg">
        {isRunning && !isPaused && (
          <span className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
            Studying...
          </span>
        )}
        {isPaused && (
          <span className="inline-flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <span className="w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full" />
            Paused
          </span>
        )}
        {!isRunning && !isPaused && (
          <span className="text-gray-500 dark:text-gray-400">
            Ready to start
          </span>
        )}
      </div>
    </div>
  )
}

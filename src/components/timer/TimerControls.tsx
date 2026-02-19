import { Play, Pause, Square } from 'lucide-react'

interface TimerControlsProps {
  isRunning: boolean
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export function TimerControls({ 
  isRunning, 
  isPaused, 
  onStart, 
  onPause, 
  onResume, 
  onStop 
}: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {!isRunning ? (
        // Start button
        <button
          onClick={onStart}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-blue-600/25"
        >
          <Play className="w-6 h-6" fill="white" />
          Start Studying
        </button>
      ) : (
        <>
          {/* Pause/Resume button */}
          {!isPaused ? (
            <button
              onClick={onPause}
              className="flex items-center gap-3 px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-semibold rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/25"
            >
              <Pause className="w-6 h-6" fill="white" />
              Pause
            </button>
          ) : (
            <button
              onClick={onResume}
              className="flex items-center gap-3 px-6 py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-green-500/25"
            >
              <Play className="w-6 h-6" fill="white" />
              Resume
            </button>
          )}
          
          {/* Stop button */}
          <button
            onClick={onStop}
            className="flex items-center gap-3 px-6 py-4 bg-red-500 hover:bg-red-600 text-white text-lg font-semibold rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-red-500/25"
          >
            <Square className="w-6 h-6" fill="white" />
            Stop
          </button>
        </>
      )}
    </div>
  )
}

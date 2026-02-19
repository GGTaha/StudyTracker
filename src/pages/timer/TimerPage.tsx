import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimerStore } from '../../stores/timerStore'
import { 
  TimerDisplay, 
  TimerControls, 
  SubjectPicker, 
  TagPicker,
  SessionHistory,
  StudyStats 
} from '../../components/timer'
import { Loader2 } from 'lucide-react'

export function TimerPage() {
  const navigate = useNavigate()
  const {
    isRunning,
    isPaused,
    elapsedSeconds,
    subjects,
    tags,
    sessions,
    selectedSubjectId,
    selectedTagId,
    isLoading,
    initialize,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setSelectedSubject,
    setSelectedTag,
    addSubject,
    addTag,
    deleteSession,
    getTodayTotal,
    getWeeklyData,
    getSubjectBreakdown,
    getDataForDateRange,
    getAllTimeTotal,
  } = useTimerStore()

  // Initialize on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Update document title when timer is running
  useEffect(() => {
    if (isRunning) {
      const hours = Math.floor(elapsedSeconds / 3600)
      const minutes = Math.floor((elapsedSeconds % 3600) / 60)
      const secs = elapsedSeconds % 60
      const formatNum = (n: number) => n.toString().padStart(2, '0')
      document.title = `${formatNum(hours)}:${formatNum(minutes)}:${formatNum(secs)} - StudyTracker`
    } else {
      document.title = 'StudyTracker'
    }

    return () => {
      document.title = 'StudyTracker'
    }
  }, [isRunning, elapsedSeconds])

  // Handle clicking on a day in the weekly chart
  const handleDayClick = useCallback((day: string) => {
    navigate(`/archive?day=${day}`)
  }, [navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Timer Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        {/* Timer Display */}
        <div className="mb-8">
          <TimerDisplay 
            seconds={elapsedSeconds} 
            isRunning={isRunning} 
            isPaused={isPaused} 
          />
        </div>

        {/* Subject & Tag Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
          <SubjectPicker
            subjects={subjects}
            selectedId={selectedSubjectId}
            onSelect={setSelectedSubject}
            onAddSubject={addSubject}
            disabled={isRunning}
          />
          <TagPicker
            tags={tags}
            selectedId={selectedTagId}
            onSelect={setSelectedTag}
            onAddTag={addTag}
            disabled={isRunning}
          />
        </div>

        {/* Timer Controls */}
        <TimerControls
          isRunning={isRunning}
          isPaused={isPaused}
          onStart={startTimer}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onStop={stopTimer}
        />
      </div>

      {/* Stats Section */}
      <StudyStats
        todayTotal={getTodayTotal()}
        weeklyData={getWeeklyData()}
        subjectBreakdown={getSubjectBreakdown()}
        onDayClick={handleDayClick}
        allTimeTotal={getAllTimeTotal()}
        getDataForRange={getDataForDateRange}
      />

      {/* Session History */}
      <SessionHistory 
        sessions={sessions} 
        onDelete={deleteSession} 
      />
    </div>
  )
}

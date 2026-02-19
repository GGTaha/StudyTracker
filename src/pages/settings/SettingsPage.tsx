import { useAuthStore } from '../../stores/authStore'
import { User, Mail, Hash, Save, Loader2, Shield, Activity, Trophy, FileText, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const { profile, updateProfile, isLoading } = useAuthStore()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  
  // Privacy settings
  const [privacyActivity, setPrivacyActivity] = useState(profile?.privacy_activity ?? true)
  const [privacyWeeklyTime, setPrivacyWeeklyTime] = useState(profile?.privacy_weekly_time ?? true)
  const [privacyPapers, setPrivacyPapers] = useState(profile?.privacy_papers ?? true)
  const [privacyLeaderboard, setPrivacyLeaderboard] = useState(profile?.privacy_leaderboard ?? true)
  
  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setPrivacyActivity(profile.privacy_activity ?? true)
      setPrivacyWeeklyTime(profile.privacy_weekly_time ?? true)
      setPrivacyPapers(profile.privacy_papers ?? true)
      setPrivacyLeaderboard(profile.privacy_leaderboard ?? true)
    }
  }, [profile])

  const handleSave = async () => {
    const { error } = await updateProfile({ 
      display_name: displayName,
      privacy_activity: privacyActivity,
      privacy_weekly_time: privacyWeeklyTime,
      privacy_papers: privacyPapers,
      privacy_leaderboard: privacyLeaderboard,
    })
    if (error) {
      toast.error(error)
    } else {
      toast.success('Profile updated successfully!')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Profile Information
        </h2>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || ''}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Change Avatar
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JPG, PNG or GIF. Max 2MB
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Username (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                type="text"
                value={profile?.username || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Username cannot be changed
            </p>
          </div>

          {/* User Code (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User Code
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={profile?.user_code || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Share this code with friends to connect
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Account Information
        </h2>
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Mail className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {profile?.id ? 'Linked email' : 'No email'}
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Privacy Settings
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Control what your friends can see about your activity
        </p>

        <div className="space-y-4">
          {/* Activity Privacy */}
          <PrivacyToggle
            icon={Activity}
            title="Study Activity"
            description="Allow friends to see your recent study sessions"
            enabled={privacyActivity}
            onChange={setPrivacyActivity}
          />
          
          {/* Weekly Time Privacy */}
          <PrivacyToggle
            icon={Clock}
            title="Weekly Study Time"
            description="Allow friends to see how much you study each week"
            enabled={privacyWeeklyTime}
            onChange={setPrivacyWeeklyTime}
          />
          
          {/* Papers Privacy */}
          <PrivacyToggle
            icon={FileText}
            title="Past Paper Progress"
            description="Allow friends to see and compare your paper marks"
            enabled={privacyPapers}
            onChange={setPrivacyPapers}
          />
          
          {/* Leaderboard Privacy */}
          <PrivacyToggle
            icon={Trophy}
            title="Leaderboard"
            description="Appear on your friends' leaderboards"
            enabled={privacyLeaderboard}
            onChange={setPrivacyLeaderboard}
          />
        </div>

        {/* Save Privacy Button */}
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save Privacy Settings
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-red-200 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Danger Zone
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  )
}

// Privacy Toggle Component
function PrivacyToggle({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ElementType
  title: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${enabled ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-200 dark:bg-gray-600'}`}>
          <Icon className={`w-5 h-5 ${enabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`
          relative w-12 h-6 rounded-full transition-colors
          ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
        `}
      >
        <span
          className={`
            absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow
            ${enabled ? 'left-6' : 'left-0.5'}
          `}
        />
      </button>
    </div>
  )
}

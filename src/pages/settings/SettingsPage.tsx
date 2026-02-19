import { useAuthStore } from '../../stores/authStore'
import { User, Hash, Save, Loader2, Shield, Activity, Trophy, FileText, Clock, Mail, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { GlassCard } from '../../components/ui/GlassCard'

export function SettingsPage() {
  const { profile, updateProfile, isLoading } = useAuthStore()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  
  const [privacyActivity, setPrivacyActivity] = useState(profile?.privacy_activity ?? true)
  const [privacyWeeklyTime, setPrivacyWeeklyTime] = useState(profile?.privacy_weekly_time ?? true)
  const [privacyPapers, setPrivacyPapers] = useState(profile?.privacy_papers ?? true)
  const [privacyLeaderboard, setPrivacyLeaderboard] = useState(profile?.privacy_leaderboard ?? true)
  
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
    <div className="pb-10 animate-fade-slide">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-5">

          {/* Profile Information */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-sky-500/10">
                <User className="w-5 h-5 text-sky-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-50">Profile Information</h2>
            </div>

            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <button className="px-4 py-2 bg-white/[0.05] border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/[0.08] hover:border-white/15 transition-colors text-sm">
                    Change Avatar
                  </button>
                  <p className="text-xs text-slate-500 mt-1.5">JPG, PNG or GIF. Max 2MB</p>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Username (read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                  <input
                    type="text"
                    value={profile?.username || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Username cannot be changed</p>
              </div>

              {/* User Code (read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">User Code</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={profile?.user_code || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Share this code with friends to connect</p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-[#09090b] font-semibold rounded-xl transition-colors shadow-[0_0_15px_rgba(56,189,248,0.15)]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </GlassCard>

          {/* Account Info */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Mail className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-50">Account Information</h2>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <Mail className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Email</p>
                <p className="font-medium text-slate-200">{profile?.id ? 'Linked email' : 'No email'}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-5">

          {/* Privacy Settings */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-50">Privacy Settings</h2>
            </div>
            <p className="text-sm text-slate-500 mb-5">Control what your friends can see about your activity</p>

            <div className="space-y-3">
              <PrivacyToggle icon={Activity} title="Study Activity" description="Allow friends to see your recent study sessions" enabled={privacyActivity} onChange={setPrivacyActivity} />
              <PrivacyToggle icon={Clock} title="Weekly Study Time" description="Allow friends to see how much you study each week" enabled={privacyWeeklyTime} onChange={setPrivacyWeeklyTime} />
              <PrivacyToggle icon={FileText} title="Past Paper Progress" description="Allow friends to see and compare your paper marks" enabled={privacyPapers} onChange={setPrivacyPapers} />
              <PrivacyToggle icon={Trophy} title="Leaderboard" description="Appear on your friends' leaderboards" enabled={privacyLeaderboard} onChange={setPrivacyLeaderboard} />
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-[#09090b] font-semibold rounded-xl transition-colors shadow-[0_0_15px_rgba(56,189,248,0.15)]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Privacy Settings
            </button>
          </GlassCard>

          {/* Danger Zone */}
          <GlassCard className="!border-rose-500/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h2 className="text-lg font-semibold text-rose-400">Danger Zone</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-semibold hover:bg-rose-500/20 hover:border-rose-500/30 transition-colors text-sm">
              Delete Account
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// ── Privacy Toggle Component ──
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
    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl transition-colors ${enabled ? 'bg-sky-500/10' : 'bg-white/[0.03]'}`}>
          <Icon className={`w-5 h-5 transition-colors ${enabled ? 'text-sky-400' : 'text-slate-600'}`} />
        </div>
        <div>
          <p className="font-medium text-slate-200 text-sm">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-sky-500' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

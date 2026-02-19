import { useState } from 'react'
import { useFriendsStore } from '../../stores/friendsStore'
import type { Profile } from '../../stores/friendsStore'
import { X, Search, UserPlus, Loader2, Check, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface AddFriendModalProps {
  onClose: () => void
}

export function AddFriendModal({ onClose }: AddFriendModalProps) {
  const { searchUsers, sendFriendRequest } = useFriendsStore()
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [sendingTo, setSendingTo] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())
  
  const handleSearch = async () => {
    if (!query.trim()) return
    
    setIsSearching(true)
    const users = await searchUsers(query)
    setResults(users)
    setIsSearching(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }
  
  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId)
    const { error } = await sendFriendRequest(userId)
    setSendingTo(null)
    
    if (error) {
      toast.error(error)
    } else {
      toast.success('Friend request sent!')
      setSentTo(prev => new Set(prev).add(userId))
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Friend
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search by username or user code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter username or #code"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Tip: You can search by exact user code (e.g., ABC123) or part of a username
            </p>
          </div>
          
          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {results.length === 0 && query && !isSearching && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No users found. Try a different search term.
              </div>
            )}
            
            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Results ({results.length})
                </p>
                {results.map(user => {
                  const isSent = sentTo.has(user.id)
                  const isSending = sendingTo === user.id
                  
                  return (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt="" 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.display_name || user.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username} • {user.user_code}
                          </p>
                        </div>
                      </div>
                      
                      {isSent ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                          <Check className="w-4 h-4" />
                          Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={isSending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Add
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Settings, Save, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { loadPreferences, savePreferences, type UserPreferences } from '@/lib/preferences'
import { cn } from '@/lib/utils'

export default function UserSettingsPage() {
  const user = useAuthStore((s) => s.user)
  const [prefs, setPrefs] = useState<UserPreferences>(loadPreferences())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setPrefs(loadPreferences())
  }, [])

  const handleSave = () => {
    savePreferences(prefs)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-xl">
      <div className="page-header">
        <p className="section-label">Account</p>
        <h2 className="page-title">Preferences</h2>
        <p className="page-subtitle">These defaults auto-fill your browse filters</p>
      </div>

      {/* Browse defaults */}
      <div className="p-6 space-y-5 mb-5" style={{ background: '#f0ece6', border: '1px solid rgba(0,0,0,0.07)' }}>
        <h3 className="font-semibold text-gray-900">Browse Defaults</h3>

        <div>
          <label className="label">Default Location</label>
          <input
            type="text"
            placeholder="e.g. Koramangala, Bangalore"
            className="input-field"
            value={prefs.defaultLocation}
            onChange={(e) => setPrefs((p) => ({ ...p, defaultLocation: e.target.value }))}
          />
          <p className="text-xs text-gray-400 mt-1">Pre-fills the location search on Browse</p>
        </div>

        <div>
          <label className="label">Preferred Hoarding Type</label>
          <select
            className="input-field"
            value={prefs.preferredType}
            onChange={(e) => setPrefs((p) => ({ ...p, preferredType: e.target.value }))}
          >
            <option value="">No preference (show all)</option>
            <option value="URBAN">Urban</option>
            <option value="LOCAL">Local</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Min Price (₹/month)</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              className="input-field"
              value={prefs.minPrice}
              onChange={(e) => setPrefs((p) => ({ ...p, minPrice: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Max Price (₹/month)</label>
            <input
              type="number"
              placeholder="e.g. 50000"
              className="input-field"
              value={prefs.maxPrice}
              onChange={(e) => setPrefs((p) => ({ ...p, maxPrice: e.target.value }))}
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            onClick={handleSave}
            className={cn(
              'btn-primary flex items-center gap-2',
              saved && 'bg-green-600 hover:bg-green-700',
            )}
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Account info (read-only) */}
      <div className="p-6" style={{ background: '#f0ece6', border: '1px solid rgba(0,0,0,0.07)' }}>
        <h3 className="font-semibold text-gray-900 mb-4">Account</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
              <p className="text-sm font-medium text-gray-900 mt-1 capitalize">
                {user?.role?.toLowerCase()}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{user?.email}</p>
          </div>
          {user?.userId && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">User ID</p>
              <p className="text-xs font-mono text-gray-400 mt-1">{user.userId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

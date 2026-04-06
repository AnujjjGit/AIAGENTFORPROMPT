import { useEffect, useState } from 'react'

export default function Popup() {
  const [apiKey, setApiKey] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['apiKey', 'enabled'], (result) => {
      if (result.apiKey) setApiKey(result.apiKey as string)
      if (result.enabled !== undefined) setEnabled(result.enabled as boolean)
    })
  }, [])

  const handleSave = () => {
    chrome.storage.local.set({ apiKey, enabled }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const handleToggle = () => {
    const next = !enabled
    setEnabled(next)
    chrome.storage.local.set({ enabled: next })
  }

  return (
    <div className="w-[380px] min-h-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 font-sans">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">✨</div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          PromptOptimizer Pro
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Supercharge your AI prompts
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
        <div>
          <p className="font-medium text-sm">Extension Status</p>
          <p className="text-xs text-slate-400">
            {enabled ? 'Optimizing your prompts' : 'Currently disabled'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
            enabled ? 'bg-purple-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
              enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* API Key Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Anthropic API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
        />
        <p className="text-xs text-slate-500 mt-2">
          Your key is stored locally and never sent to third parties.
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98]"
      >
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      {/* Supported Platforms */}
      <div className="mt-8">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
          Supported Platforms
        </p>
        <div className="grid grid-cols-3 gap-2">
          {['ChatGPT', 'Claude', 'Gemini'].map((name) => (
            <div
              key={name}
              className="bg-slate-800/30 border border-slate-700/30 rounded-lg py-2 px-3 text-center text-xs text-slate-400"
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-600">
          v1.0.0 — Powered by Claude 3.5 Haiku
        </p>
      </div>
    </div>
  )
}

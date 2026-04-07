import { useEffect, useState } from 'react'

type Tab = 'optimize' | 'settings'
type Platform = 'claude' | 'chatgpt' | 'gemini'

const MODEL_INFO: Record<Platform, { name: string; icon: string; strengths: string[]; best: string }> = {
  claude: {
    name: 'Claude',
    icon: '🟣',
    strengths: ['Long-form analysis', 'Code generation', 'Nuanced reasoning', 'XML-structured prompts'],
    best: 'Best for: complex reasoning, coding, and detailed writing tasks',
  },
  chatgpt: {
    name: 'ChatGPT',
    icon: '🟢',
    strengths: ['General knowledge', 'Creative writing', 'Conversational', 'Plugin ecosystem'],
    best: 'Best for: creative content, brainstorming, and general Q&A',
  },
  gemini: {
    name: 'Gemini',
    icon: '🔵',
    strengths: ['Multimodal tasks', 'Google integration', 'Factual queries', 'Structured data'],
    best: 'Best for: research, factual queries, and multimodal tasks',
  },
}

export default function Popup() {
  const [tab, setTab] = useState<Tab>('optimize')
  const [apiKey, setApiKey] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [saved, setSaved] = useState(false)

  // Optimizer state
  const [inputText, setInputText] = useState('')
  const [optimizedText, setOptimizedText] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('claude')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokensBefore, setTokensBefore] = useState(0)
  const [tokensAfter, setTokensAfter] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['apiKey', 'enabled'], (result) => {
      if (result.apiKey) setApiKey(result.apiKey as string)
      if (result.enabled !== undefined) setEnabled(result.enabled as boolean)
    })
  }, [])

  const estimateTokens = (text: string) => Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3)

  const handleOptimize = () => {
    if (!inputText.trim()) return

    setLoading(true)
    setError('')
    setOptimizedText('')
    setTokensBefore(estimateTokens(inputText))

    chrome.runtime.sendMessage(
      {
        type: 'OPTIMIZE_PROMPT',
        payload: {
          text: inputText,
          url: `https://${selectedPlatform === 'chatgpt' ? 'chatgpt.com' : selectedPlatform === 'claude' ? 'claude.ai' : 'gemini.google.com'}/`,
        },
      },
      (response) => {
        setLoading(false)
        if (chrome.runtime.lastError) {
          setError('Extension error. Try reloading.')
          return
        }
        if (!response?.success) {
          setError(response?.error || 'Optimization failed.')
          return
        }
        setOptimizedText(response.optimizedText)
        setTokensAfter(estimateTokens(response.optimizedText))
      }
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

  const savingsPercent = tokensBefore > 0 && tokensAfter > 0
    ? Math.round(((tokensBefore - tokensAfter) / tokensBefore) * 100)
    : 0

  const info = MODEL_INFO[selectedPlatform]

  return (
    <div className="w-[420px] min-h-[580px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans flex flex-col">
      {/* Header */}
      <div className="text-center pt-5 pb-3 px-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          PromptOptimizer Pro
        </h1>
      </div>

      {/* Tab Bar */}
      <div className="flex mx-6 mb-4 bg-slate-800/60 rounded-lg p-1 border border-slate-700/40">
        <button
          onClick={() => setTab('optimize')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
            tab === 'optimize'
              ? 'bg-purple-500/90 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Optimize
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
            tab === 'settings'
              ? 'bg-purple-500/90 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-5 overflow-y-auto">
        {tab === 'optimize' ? (
          <div className="flex flex-col gap-4">
            {/* Platform Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Target Model
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(MODEL_INFO) as Platform[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    className={`py-2.5 px-2 rounded-lg text-xs font-medium transition-all border ${
                      selectedPlatform === p
                        ? 'bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-sm shadow-purple-500/10'
                        : 'bg-slate-800/40 border-slate-700/30 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="block text-base mb-0.5">{MODEL_INFO[p].icon}</span>
                    {MODEL_INFO[p].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Recommendation Card */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{info.icon}</span>
                <span className="text-sm font-medium text-white">{info.name} Optimization</span>
              </div>
              <p className="text-xs text-purple-300 mb-2">{info.best}</p>
              <div className="flex flex-wrap gap-1.5">
                {info.strengths.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Your Prompt
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your rough prompt here..."
                rows={4}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
              />
              {inputText && (
                <p className="text-[10px] text-slate-500 mt-1">
                  ~{estimateTokens(inputText)} tokens
                </p>
              )}
            </div>

            {/* Optimize Button */}
            <button
              onClick={handleOptimize}
              disabled={loading || !inputText.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Optimizing...
                </>
              ) : (
                'Optimize Prompt'
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Results */}
            {optimizedText && (
              <div className="flex flex-col gap-3">
                {/* Stats Bar */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-800/40 border border-slate-700/30 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Before</p>
                    <p className="text-sm font-bold text-slate-300">{tokensBefore}</p>
                    <p className="text-[10px] text-slate-500">tokens</p>
                  </div>
                  <div className="flex-1 bg-slate-800/40 border border-slate-700/30 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">After</p>
                    <p className="text-sm font-bold text-green-400">{tokensAfter}</p>
                    <p className="text-[10px] text-slate-500">tokens</p>
                  </div>
                  <div className="flex-1 bg-purple-500/10 border border-purple-500/30 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-purple-400 uppercase">Saved</p>
                    <p className="text-sm font-bold text-purple-300">{savingsPercent > 0 ? savingsPercent : '~'}%</p>
                    <p className="text-[10px] text-purple-400">reduction</p>
                  </div>
                </div>

                {/* Optimized Output */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-400">
                      Optimized for {info.icon} {info.name}
                    </label>
                    <button
                      onClick={handleCopy}
                      className="text-[10px] px-2 py-1 rounded bg-slate-700/60 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-slate-800/60 border border-green-500/20 rounded-lg p-3 text-sm text-green-200 whitespace-pre-wrap max-h-[200px] overflow-y-auto leading-relaxed">
                    {optimizedText}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Settings Tab */
          <div className="flex flex-col gap-5">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
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
            <div>
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
                Stored locally. Never sent to third parties.
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98]"
            >
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>

            {/* How It Works */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-300 mb-3 uppercase tracking-wider">How It Works</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { step: '1', text: 'Type a prompt on ChatGPT, Claude, or Gemini' },
                  { step: '2', text: 'Click the "Optimize" button or use the popup' },
                  { step: '3', text: 'AI rewrites it — structured, compressed, model-tailored' },
                  { step: '4', text: 'Optimized prompt replaces your input automatically' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold flex items-center justify-center">
                      {step}
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-slate-600">
                v1.0.0 — Powered by Claude 3.5 Haiku
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

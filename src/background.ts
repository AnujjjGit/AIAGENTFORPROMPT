const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-3-5-haiku-latest'

function buildSystemPrompt(targetPlatform: string): string {
  return `You are an expert prompt-engineering API. Your job is to take a user's rough, messy text and rewrite it into a highly optimized prompt tailored for a specific AI model. Remove all conversational fluff, compress the token count, and clarify the core intent.
Target Model: ${targetPlatform}.
Rules based on Target Model:
- If target is 'claude', strictly structure the prompt using XML tags (e.g., <context>, <task>, <constraints>).
- If target is 'gemini', use strong Markdown headers, bulleted constraints, and clear, chronological steps.
- If target is 'chatgpt', use clear, distinct paragraphs with a defined persona at the very beginning.
CRITICAL: Output ONLY the rewritten prompt. Do not include any conversational filler, preambles, or explanations. The output will be directly injected into a text box.`
}

function detectPlatform(url: string): string {
  if (url.includes('claude.ai')) return 'claude'
  if (url.includes('gemini.google.com')) return 'gemini'
  if (url.includes('chatgpt.com')) return 'chatgpt'
  return 'chatgpt'
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'OPTIMIZE_PROMPT') return false

  const { text, url } = message.payload
  const targetPlatform = detectPlatform(url)

  ;(async () => {
    try {
      const result = await chrome.storage.local.get(['apiKey', 'enabled'])

      if (!result.apiKey) {
        sendResponse({
          success: false,
          error: 'API key not configured. Open the extension popup to add your Anthropic API key.',
        })
        return
      }

      if (result.enabled === false) {
        sendResponse({
          success: false,
          error: 'PromptOptimizer Pro is disabled. Enable it from the popup.',
        })
        return
      }

      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': result.apiKey as string,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          system: buildSystemPrompt(targetPlatform),
          messages: [
            {
              role: 'user',
              content: text,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        if (response.status === 401) {
          sendResponse({
            success: false,
            error: 'Invalid API key. Please check your Anthropic API key in the extension settings.',
          })
        } else {
          sendResponse({
            success: false,
            error: `API error (${response.status}): ${errorBody}`,
          })
        }
        return
      }

      const data = await response.json()
      const optimizedText = data.content?.[0]?.text ?? ''

      if (!optimizedText) {
        sendResponse({
          success: false,
          error: 'Received empty response from the optimizer.',
        })
        return
      }

      sendResponse({ success: true, optimizedText })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      sendResponse({
        success: false,
        error: `Network error: ${errorMessage}`,
      })
    }
  })()

  // Return true to indicate we will respond asynchronously
  return true
})

// Content script for PromptOptimizer Pro
// Injects a Shadow DOM button next to AI platform text inputs

const BUTTON_ID = 'prompt-optimizer-pro-root'

// Platform-specific selectors for the main text input
const INPUT_SELECTORS = [
  // ChatGPT
  'textarea[id="prompt-textarea"]',
  'div#prompt-textarea[contenteditable="true"]',
  // Claude
  'div.ProseMirror[contenteditable="true"]',
  // Gemini
  'div.ql-editor[contenteditable="true"]',
  'rich-textarea .ql-editor',
]

function getInputElement(): HTMLElement | null {
  for (const selector of INPUT_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) return el
  }
  return null
}

function getTextFromInput(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement) {
    return el.value
  }
  return el.innerText || el.textContent || ''
}

function setTextOnInput(el: HTMLElement, text: string) {
  if (el instanceof HTMLTextAreaElement) {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value'
    )?.set
    nativeSetter?.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  } else {
    // contenteditable div — clear and set text, triggering input events
    el.focus()
    el.innerHTML = ''
    // Use execCommand for compatibility with React/Angular controlled inputs
    document.execCommand('insertText', false, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

function createOptimizeButton(): HTMLElement {
  const host = document.createElement('div')
  host.id = BUTTON_ID
  host.style.cssText = 'position: absolute; z-index: 99999; top: -36px; right: 8px;'

  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = `
    .opt-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      color: white;
      font-size: 13px;
      font-weight: 600;
      font-family: system-ui, -apple-system, sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
      white-space: nowrap;
    }
    .opt-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.5);
    }
    .opt-btn:active {
      transform: scale(0.97);
    }
    .opt-btn.loading {
      opacity: 0.8;
      pointer-events: none;
    }
    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .toast {
      position: absolute;
      top: 32px;
      right: 0;
      background: #ef4444;
      color: white;
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 6px;
      white-space: nowrap;
      animation: fadeIn 0.2s ease;
      max-width: 280px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `
  shadow.appendChild(style)

  const wrapper = document.createElement('div')
  wrapper.style.position = 'relative'

  const button = document.createElement('button')
  button.className = 'opt-btn'
  button.innerHTML = '✨ Optimize'

  button.addEventListener('click', async () => {
    const inputEl = getInputElement()
    if (!inputEl) return

    const text = getTextFromInput(inputEl).trim()
    if (!text) return

    // Show loading state
    button.classList.add('loading')
    button.innerHTML = '<div class="spinner"></div> Optimizing...'

    // Remove any existing toast
    const oldToast = wrapper.querySelector('.toast')
    if (oldToast) oldToast.remove()

    chrome.runtime.sendMessage(
      {
        type: 'OPTIMIZE_PROMPT',
        payload: { text, url: window.location.href },
      },
      (response) => {
        // Reset button
        button.classList.remove('loading')
        button.innerHTML = '✨ Optimize'

        if (chrome.runtime.lastError) {
          showToast(wrapper, 'Extension error. Try reloading the page.')
          return
        }

        if (!response || !response.success) {
          showToast(wrapper, response?.error || 'Optimization failed.')
          return
        }

        setTextOnInput(inputEl, response.optimizedText)
      }
    )
  })

  wrapper.appendChild(button)
  shadow.appendChild(wrapper)

  return host
}

function showToast(parent: HTMLElement, message: string) {
  const existing = parent.querySelector('.toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = message
  parent.appendChild(toast)

  setTimeout(() => toast.remove(), 4000)
}

function injectButton() {
  // Don't inject twice
  if (document.getElementById(BUTTON_ID)) return

  const inputEl = getInputElement()
  if (!inputEl) return

  // Find the closest positioned parent to anchor the button
  const container = inputEl.closest('form') || inputEl.parentElement
  if (!container) return

  // Ensure the container is positioned
  const computed = getComputedStyle(container)
  if (computed.position === 'static') {
    ;(container as HTMLElement).style.position = 'relative'
  }

  const button = createOptimizeButton()
  container.appendChild(button)
}

// Use MutationObserver to detect when the input area appears
const observer = new MutationObserver(() => {
  if (!document.getElementById(BUTTON_ID)) {
    injectButton()
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
})

// Try injecting immediately in case the input is already present
injectButton()

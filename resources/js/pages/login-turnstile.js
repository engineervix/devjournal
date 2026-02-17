/**
 * Cloudflare Turnstile Integration for Login Page
 *
 * This module handles the Turnstile security challenge callbacks
 * and manages the login button state based on verification status.
 *
 * Extracted from resources/views/pages/login.edge
 */

/**
 * Initialize Turnstile callbacks and form validation
 * Must be called before Turnstile widget renders
 */
export function initTurnstile() {
  const loginForm = document.getElementById('loginForm')
  const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null
  const turnstileContainer = document.getElementById('turnstile-container')

  if (!loginForm || !submitButton || !turnstileContainer) {
    // Only warn if we're on a page that *should* have these elements (i.e. login page)
    if (document.querySelector('.login-container')) {
      console.warn('Login form, submit button, or Turnstile container not found')
    }
    return
  }

  // Disable submit button initially if Turnstile is configured
  submitButton.disabled = true
  submitButton.textContent = 'Completing Security Check...'

  /**
   * Called when Turnstile verification succeeds
   * @param {string} token - The verification token
   */
  window.onTurnstileSuccess = function (token) {
    console.log('Turnstile verification successful')

    // Query button again to ensure we have the live element (handling potential HMR/DOM updates)
    const btn = document.querySelector('button[type="submit"]') || submitButton
    if (btn) {
      btn.disabled = false
      btn.innerHTML =
        '<i class="ph ph-sign-in mr-2 group-hover:translate-x-1 transition-transform duration-200"></i>Sign In to DevJournal'
    }
  }

  /**
   * Called when Turnstile verification fails
   * @param {string} errorCode - The error code from Turnstile
   */
  window.onTurnstileError = function (errorCode) {
    console.error('Turnstile verification failed:', errorCode)

    // Keep button disabled and show error
    submitButton.disabled = true // Keep disabled on error
    submitButton.textContent = 'Security Check Failed - Try Again'

    // Allow user to reset manually if needed, or wait for reset
    setTimeout(() => {
      if (window.turnstile) turnstile.reset()
    }, 2000)

    alert('Security challenge failed. Please refresh the page and try again.')
  }

  /**
   * Called when Turnstile verification expires
   * User needs to complete the challenge again
   */
  window.onTurnstileExpired = function () {
    console.log('Turnstile verification expired')

    // Disable button and prompt user to re-verify
    submitButton.disabled = true
    submitButton.textContent = 'Completing Security Check...'
  }

  // Prevent form submission without Turnstile response
  loginForm.addEventListener('submit', function (e) {
    const turnstileResponse = document.querySelector('input[name="cf-turnstile-response"]')
    if (!turnstileResponse || !turnstileResponse.value || turnstileResponse.value.trim() === '') {
      e.preventDefault()
      alert('Please complete the security challenge before submitting.')
      return false
    }
  })

  // Explicit Render Function
  let widgetId = null

  const renderTurnstile = () => {
    if (widgetId !== null) {
      return
    }

    if (window.turnstile) {
      try {
        // Check if container already has elements (ignoring whitespace text nodes)
        if (turnstileContainer.children.length > 0) {
          console.log('Turnstile container already has widget, skipping render')
          return
        }

        widgetId = turnstile.render('#turnstile-container', {
          'sitekey': turnstileContainer.getAttribute('data-sitekey'),
          'theme': 'auto',
          'size': 'normal',
          'callback': window.onTurnstileSuccess,
          'error-callback': window.onTurnstileError,
          'expired-callback': window.onTurnstileExpired,
        })
        console.log('Turnstile explicit render initiated')
      } catch (e) {
        console.error('Turnstile render error:', e)
      }
    }
  }

  // Handle global callback buffer
  window.handleTurnstileLoad = renderTurnstile

  // Trigger if already loaded
  if (window.isTurnstileLoaded || window.turnstile) {
    renderTurnstile()
  }

  console.log('Turnstile callbacks initialized')
}

// Auto-init
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTurnstile)
  } else {
    initTurnstile()
  }
}

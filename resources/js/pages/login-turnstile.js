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

  if (!loginForm || !submitButton) {
    console.warn('Login form or submit button not found')
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

    // Enable submit button
    submitButton.disabled = false
    submitButton.innerHTML =
      '<i class="ph ph-sign-in mr-2 group-hover:translate-x-1 transition-transform duration-200"></i>Sign In to DevJournal'
  }

  /**
   * Called when Turnstile verification fails
   * @param {string} errorCode - The error code from Turnstile
   */
  window.onTurnstileError = function (errorCode) {
    console.error('Turnstile verification failed:', errorCode)

    // Keep button disabled and show error
    submitButton.disabled = false
    submitButton.textContent = 'Security Check Failed - Try Again'

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

  console.log('Turnstile callbacks initialized')
}

/**
 * Auto-initialize when module is imported
 * Use DOMContentLoaded to ensure DOM exists
 */
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTurnstile)
  } else {
    // DOM already loaded
    initTurnstile()
  }
}

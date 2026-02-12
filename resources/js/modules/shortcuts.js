/**
 * Keyboard Shortcuts Module
 * Handles global keyboard shortcuts and form submission shortcuts
 */

export function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', function (e) {
    const newEntryRoute = document.body.dataset.newEntryRoute // Get route from data attribute
    const searchInput = document.querySelector('input[name="q"]')

    // Cmd/Ctrl + N for new entry
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      if (newEntryRoute) {
        e.preventDefault()
        window.location.href = newEntryRoute
      }
    }

    // Cmd/Ctrl + / for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      if (searchInput) {
        e.preventDefault()
        searchInput.focus()
      }
    }
  })
}

export function initializeFormShortcuts() {
  document.addEventListener('keydown', function (e) {
    // Handle Ctrl/Cmd + S for form submission (universal save shortcut)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      const targetElement = e.target
      const form = targetElement.closest('form')

      if (form) {
        // Check if this form contains an EasyMDE editor
        // If it does, let the EasyMDE component handle the shortcut
        const hasEasyMDE = form.querySelector('[x-data*="easyMDEEditor"]')
        if (hasEasyMDE) {
          return // Let EasyMDE handle it
        }

        e.preventDefault()

        // Trigger form submission via the AJAX form component if available
        const ajaxFormElement = form.closest('[x-data*="ajaxForm"]')
        if (ajaxFormElement && ajaxFormElement._x_dataStack) {
          const ajaxFormData = ajaxFormElement._x_dataStack[0]
          if (ajaxFormData && ajaxFormData.submitForm) {
            ajaxFormData.submitForm(e)
            return
          }
        }

        // To ensure submit buttons with formaction/formmethod are respected,
        // we should try to click a primary submit button if one exists.
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]')
        if (submitButton) {
          submitButton.click() // Click the button to trigger its specific actions
        } else {
          form.submit() // Fallback to direct form submission
        }
      }
    }

    // Keep the old Ctrl/Cmd + Enter for backward compatibility in non-EasyMDE forms
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const targetElement = e.target
      const form = targetElement.closest('form')

      if (form) {
        // Only handle this if the form doesn't have EasyMDE
        const hasEasyMDE = form.querySelector('[x-data*="easyMDEEditor"]')
        if (hasEasyMDE) {
          return // Let EasyMDE handle it or ignore
        }

        // Check if the target is a textarea to prevent submission when adding a newline
        if (targetElement.tagName === 'TEXTAREA' && !e.shiftKey) {
          // Allow Shift+Enter for newline in textarea, but Ctrl/Cmd+Enter submits
          // Or, if it's not a textarea, submit directly
        } else if (targetElement.tagName !== 'TEXTAREA') {
          // Allow submission for non-textarea elements
        } else {
          // If it is a textarea and shiftKey is pressed, don't submit (allow newline)
          return
        }

        e.preventDefault()
        // To ensure submit buttons with formaction/formmethod are respected,
        // we should try to click a primary submit button if one exists.
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]')
        if (submitButton) {
          submitButton.click() // Click the button to trigger its specific actions
        } else {
          form.submit() // Fallback to direct form submission
        }
      }
    }
  })
}

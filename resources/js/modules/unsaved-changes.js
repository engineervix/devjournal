/**
 * Unsaved Changes Module
 * Prevents users from accidentally losing unsaved changes when creating or editing entries
 */

export function initializeUnsavedChangesProtection() {
  // Clean up any existing indicators from previous page loads
  const existingIndicator = document.getElementById('unsaved-changes-indicator')
  if (existingIndicator) {
    existingIndicator.remove()
  }

  // Reset initialization flag for new page
  window.unsavedChangesInitialized = false

  // Initialize on forms that need protection (only create and edit forms)
  // Look for forms that contain entry editing fields (contentMarkdown textarea)
  const formsToProtect = document.querySelectorAll('form textarea[name="contentMarkdown"]')
  const entryForms = Array.from(formsToProtect)
    .map((textarea) => textarea.closest('form'))
    .filter(Boolean)

  if (entryForms.length === 0) {
    return // No forms to protect on this page
  }

  // Prevent multiple initializations on the same page
  if (window.unsavedChangesInitialized) {
    return
  }
  window.unsavedChangesInitialized = true

  let hasUnsavedChanges = false
  let originalFormData = {}
  let isSubmitting = false

  // Set up visual indicators once globally (only when we have forms to protect)
  setupVisualIndicators()

  // Set up global protection once (only when we have forms to protect)
  setupGlobalProtection()

  entryForms.forEach((form) => {
    initializeFormProtection(form)
  })

  // Add a small delay to ensure all components are initialized
  setTimeout(() => {
    // Recapture original form data after all components are ready
    entryForms.forEach((form) => {
      captureOriginalFormData(form)
    })
    // Ensure we start with no unsaved changes
    setUnsavedChanges(false)
  }, 100)

  function initializeFormProtection(form) {
    // Store original form data
    captureOriginalFormData(form)

    // Set up change detection
    setupChangeDetection(form)

    // Set up form submission handling
    setupFormSubmissionHandling(form)
  }

  // Set up browser and navigation protection once globally
  function setupGlobalProtection() {
    setupBrowserNavigationProtection()
    setupInAppNavigationProtection()
  }

  function captureOriginalFormData(form) {
    const formData = new FormData(form)
    originalFormData = {}

    for (let [key, value] of formData.entries()) {
      originalFormData[key] = value
    }

    // Also capture EasyMDE content if present
    if (window.easyMDEEditorInstance && window.easyMDEEditorInstance.isReady()) {
      originalFormData.contentMarkdown = window.easyMDEEditorInstance.getValue()
    }
  }

  function setupChangeDetection(form) {
    // Monitor regular form inputs
    const inputs = form.querySelectorAll('input, select, textarea:not([name="contentMarkdown"])')
    inputs.forEach((input) => {
      input.addEventListener('input', checkForChanges)
      input.addEventListener('change', checkForChanges)
    })

    // Monitor EasyMDE editor changes
    const checkEasyMDEChanges = () => {
      if (window.easyMDEEditorInstance && window.easyMDEEditorInstance.isReady()) {
        const currentContent = window.easyMDEEditorInstance.getValue()
        const originalContent = originalFormData.contentMarkdown || ''

        const contentChanged = currentContent.trim() !== originalContent.trim()

        if (contentChanged) {
          setUnsavedChanges(true)
        } else {
          // Content is back to original, check if other fields have changes
          checkForChanges(form)
        }
      }
    }

    // Listen for EasyMDE editor events
    document.addEventListener('easymde:ready', () => {
      // Update original content when editor is ready and recapture all form data
      if (window.easyMDEEditorInstance && window.easyMDEEditorInstance.isReady()) {
        // Recapture all original form data now that EasyMDE is ready
        captureOriginalFormData(form)
        // Reset unsaved changes state since we just captured the baseline
        setUnsavedChanges(false)
      }
    })

    document.addEventListener('easymde:change', checkEasyMDEChanges)
  }

  function checkForChanges(targetForm = null) {
    const form = targetForm || (this && this.closest ? this.closest('form') : null)
    if (!form) return

    const currentFormData = new FormData(form)
    let hasChanges = false

    // Check regular form fields (excluding contentMarkdown as it's handled separately)
    for (let [key, value] of currentFormData.entries()) {
      if (key !== 'contentMarkdown' && originalFormData[key] !== value) {
        hasChanges = true
        break
      }
    }

    // Check if any original fields are missing in current data
    if (!hasChanges) {
      for (let key in originalFormData) {
        if (key !== 'contentMarkdown' && !currentFormData.has(key) && originalFormData[key]) {
          hasChanges = true
          break
        }
      }
    }

    // Check if we need to update unsaved changes state
    // This handles both setting and clearing the flag
    const contentChanged =
      window.easyMDEEditorInstance && window.easyMDEEditorInstance.isReady()
        ? window.easyMDEEditorInstance.getValue().trim() !==
          (originalFormData.contentMarkdown || '').trim()
        : false

    setUnsavedChanges(hasChanges || contentChanged)
  }

  function setUnsavedChanges(value) {
    hasUnsavedChanges = value
    window.formChanged = value // Keep compatibility with existing code

    // Update visual indicators
    updateVisualIndicators(value)

    // Dispatch custom event for other components to listen to
    document.dispatchEvent(
      new CustomEvent('unsavedChanges', {
        detail: { hasUnsavedChanges: value },
      })
    )
  }

  function setupFormSubmissionHandling(form) {
    form.addEventListener('submit', function (e) {
      isSubmitting = true
      setUnsavedChanges(false)
    })
  }

  function setupBrowserNavigationProtection() {
    window.addEventListener('beforeunload', function (e) {
      if (hasUnsavedChanges && !isSubmitting) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    })

    // Handle browser back/forward navigation
    window.addEventListener('popstate', function (e) {
      if (hasUnsavedChanges && !isSubmitting) {
        const shouldLeave = confirm(
          'You have unsaved changes. Are you sure you want to leave this page?'
        )
        if (!shouldLeave) {
          // Push the current state back to prevent navigation
          history.pushState(null, '', window.location.href)
        } else {
          setUnsavedChanges(false)
        }
      }
    })

    // Push initial state to enable popstate detection
    history.replaceState(null, '', window.location.href)

    // Handle keyboard shortcuts that might cause navigation
    document.addEventListener('keydown', function (e) {
      if (hasUnsavedChanges && !isSubmitting) {
        // Cmd/Ctrl + R (refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
          e.preventDefault()
          if (confirm('You have unsaved changes. Are you sure you want to refresh the page?')) {
            setUnsavedChanges(false)
            window.location.reload()
          }
        }
        // Cmd/Ctrl + W (close tab) - can't prevent but beforeunload will handle it
        // F5 (refresh)
        else if (e.key === 'F5') {
          e.preventDefault()
          if (confirm('You have unsaved changes. Are you sure you want to refresh the page?')) {
            setUnsavedChanges(false)
            window.location.reload()
          }
        }
      }
    })
  }

  function setupInAppNavigationProtection() {
    // Intercept clicks on navigation links
    document.addEventListener('click', function (e) {
      if (!hasUnsavedChanges || isSubmitting) return

      const link = e.target.closest('a[href]')
      if (!link) return

      // Skip if it's a hash link or external link
      const href = link.getAttribute('href')
      if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) {
        return
      }

      // Skip if it's the cancel link (let it work normally)
      if (
        link.textContent.trim().toLowerCase().includes('cancel') ||
        link.querySelector('i.ph-x')
      ) {
        return
      }

      // Show confirmation dialog
      e.preventDefault()

      if (confirm('You have unsaved changes. Are you sure you want to leave this page?')) {
        setUnsavedChanges(false)
        window.location.href = href
      }
    })
  }

  function setupVisualIndicators() {
    // Check if indicator already exists
    let indicator = document.getElementById('unsaved-changes-indicator')

    if (!indicator) {
      // Create unsaved changes indicator
      indicator = document.createElement('div')
      indicator.id = 'unsaved-changes-indicator'
      indicator.className =
        'fixed top-4 right-4 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-md shadow-lg border border-amber-200 dark:border-amber-700 transition-all duration-300 transform translate-x-full opacity-0 z-50 hidden'
      indicator.innerHTML = `
        <div class="flex items-center space-x-2">
          <i class="ph ph-warning-circle"></i>
          <span class="text-sm font-medium">Unsaved changes</span>
        </div>
      `

      document.body.appendChild(indicator)
    }

    // Add indicator to page title
    const originalTitle = document.title

    window.updateVisualIndicators = function (hasChanges) {
      const currentIndicator = document.getElementById('unsaved-changes-indicator')
      if (!currentIndicator) return

      if (hasChanges) {
        // Show floating indicator
        currentIndicator.classList.remove('translate-x-full', 'opacity-0', 'hidden')
        currentIndicator.classList.add('translate-x-0', 'opacity-100', 'visible')

        // Update page title
        if (!document.title.startsWith('● ')) {
          document.title = '● ' + originalTitle
        }
      } else {
        // Hide floating indicator
        currentIndicator.classList.add('translate-x-full', 'opacity-0', 'hidden')
        currentIndicator.classList.remove('translate-x-0', 'opacity-100', 'visible')

        // Restore page title
        document.title = originalTitle
      }
    }
  }

  function updateVisualIndicators(hasChanges) {
    if (window.updateVisualIndicators) {
      window.updateVisualIndicators(hasChanges)
    }
  }

  // Public API
  window.unsavedChanges = {
    hasUnsavedChanges: () => hasUnsavedChanges,
    setUnsavedChanges: setUnsavedChanges,
    clearUnsavedChanges: () => {
      setUnsavedChanges(false)
      // Recapture the current form data as the new baseline
      entryForms.forEach((form) => {
        captureOriginalFormData(form)
      })
    },
    setSubmitting: (value) => {
      isSubmitting = value
    },
  }
}

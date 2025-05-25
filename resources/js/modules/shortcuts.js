/**
 * Keyboard Shortcuts Module
 * Handles global keyboard shortcuts and form submission shortcuts
 */

export function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    const newEntryRoute = document.body.dataset.newEntryRoute; // Get route from data attribute
    const searchInput = document.querySelector('input[name="q"]');

    // Cmd/Ctrl + N for new entry
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      if (newEntryRoute) {
        e.preventDefault();
        window.location.href = newEntryRoute;
      }
    }

    // Cmd/Ctrl + / for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });
}

export function initializeFormShortcuts() {
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      // Find the closest form element to the currently focused element or the body
      const targetElement = e.target;
      const form = targetElement.closest('form');

      if (form) {
        // Check if the target is a textarea to prevent submission when adding a newline
        if (targetElement.tagName === 'TEXTAREA' && !e.shiftKey) {
          // Allow Shift+Enter for newline in textarea, but Ctrl/Cmd+Enter submits
          // Or, if it's not a textarea, submit directly
        } else if (targetElement.tagName !== 'TEXTAREA') {
          // Allow submission for non-textarea elements
        } else {
          // If it is a textarea and shiftKey is pressed, don't submit (allow newline)
          return;
        }

        e.preventDefault();
        // To ensure submit buttons with formaction/formmethod are respected,
        // we should try to click a primary submit button if one exists.
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          submitButton.click(); // Click the button to trigger its specific actions
        } else {
          form.submit(); // Fallback to direct form submission
        }
      }
    }
  });
}

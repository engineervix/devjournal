import Alpine from 'alpinejs';
import "@phosphor-icons/web/regular";

// Theme toggle functionality
function initializeThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;
  const lightIcon = document.querySelector('.theme-icon-light');
  const darkIcon = document.querySelector('.theme-icon-dark');

  function applyTheme(theme) {
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      if (lightIcon) lightIcon.classList.add('hidden');
      if (darkIcon) darkIcon.classList.remove('hidden');
    } else {
      htmlElement.classList.remove('dark');
      if (lightIcon) lightIcon.classList.remove('hidden');
      if (darkIcon) darkIcon.classList.add('hidden');
    }
  }

  // Initialize theme based on localStorage or system preference
  const storedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (storedTheme) {
    applyTheme(storedTheme);
  } else {
    applyTheme(systemPrefersDark ? 'dark' : 'light');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = htmlElement.classList.contains('dark');
      const newTheme = isDark ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    });
  }
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
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

// Function to handle Cmd/Ctrl + Enter for form submission
function initializeFormShortcuts() {
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

// Alpine.js components
document.addEventListener('alpine:init', () => {
  Alpine.data('userMenu', () => ({
    open: false,
    toggle() {
      this.open = !this.open;
    },
    close() {
      this.open = false;
    },
  }));
});

window.Alpine = Alpine;
Alpine.start();

// Initialize functionalities after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeThemeToggle();
  initializeKeyboardShortcuts();
  initializeFormShortcuts();
});

console.log('DevJournal App Initialized with Alpine, Theme Toggle, Shortcuts, and Form Submit');

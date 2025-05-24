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
});

console.log('DevJournal App Initialized with Alpine, Theme Toggle, and Shortcuts');

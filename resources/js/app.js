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

  Alpine.data('mobileMenu', () => ({
    open: false,
    toggle() {
      this.open = !this.open;
    },
    close() {
      this.open = false;
    },
  }));

  Alpine.data('markdownEditor', () => ({
    content: '',
    activeTab: 'write',
    preview: 'Loading preview...',

    init(initialContent = '') {
      this.content = initialContent;
      // Register this editor instance globally so templates can access it
      window.markdownEditorInstance = this;
    },

    renderPreview() {
      // In a real implementation we would make an AJAX call to a server-side markdown renderer
      // but for simplicity, let's use a basic client-side markdown renderer
      // In production, replace this with a proper markdown-to-html conversion

      if (this.content.trim() === '') {
        this.preview = '<p class="text-gray-500">Nothing to preview</p>';
        return;
      }

      // Simple markdown formatting (this is just a basic example)
      let html = this.content
        // Headers
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        // Bold
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*)\*/g, '<em>$1</em>')
        // Lists
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Line breaks
        .replace(/\n/g, '<br>');

      // Wrap lists
      html = html.replace(/<li>.*<\/li><br><li>/g, (match) => {
        return '<ul>' + match;
      });
      html = html.replace(/<\/li><br>/g, '</li></ul><br>');

      this.preview = html;
    },

    insertTemplate(template) {
      this.content = template;
      this.activeTab = 'write';
    }
  }));

  Alpine.data('tagInput', (suggestions = [], initialSelected = []) => ({
    inputValue: '',
    suggestions: suggestions,
    selected: initialSelected,
    filteredSuggestions: [],
    showSuggestions: false,
    selectedSuggestionIndex: 0,

    filterSuggestions() {
      if (this.inputValue.trim() === '') {
        this.filteredSuggestions = [];
        this.showSuggestions = false;
        return;
      }

      this.filteredSuggestions = this.suggestions
        .filter(tag =>
          tag.toLowerCase().includes(this.inputValue.toLowerCase()) &&
          !this.selected.includes(tag)
        )
        .slice(0, 5);

      this.showSuggestions = this.filteredSuggestions.length > 0;
      this.selectedSuggestionIndex = 0;
    },

    addTag() {
      if (this.inputValue.trim() === '') return;

      if (this.showSuggestions && this.selectedSuggestionIndex >= 0) {
        this.selectSuggestion(this.filteredSuggestions[this.selectedSuggestionIndex]);
        return;
      }

      const newTag = this.inputValue.trim();
      if (!this.selected.includes(newTag)) {
        this.selected.push(newTag);
      }

      this.inputValue = '';
      this.showSuggestions = false;
    },

    removeTag(index) {
      this.selected.splice(index, 1);
    },

    selectSuggestion(suggestion) {
      if (!this.selected.includes(suggestion)) {
        this.selected.push(suggestion);
      }

      this.inputValue = '';
      this.showSuggestions = false;
    },

    navigateSuggestion(step) {
      if (!this.showSuggestions) return;

      const max = this.filteredSuggestions.length - 1;
      const next = this.selectedSuggestionIndex + step;

      if (next < 0) {
        this.selectedSuggestionIndex = max;
      } else if (next > max) {
        this.selectedSuggestionIndex = 0;
      } else {
        this.selectedSuggestionIndex = next;
      }
    }
  }));
});

window.Alpine = Alpine;
Alpine.start();

// Global function to insert template into markdown editor
window.insertTemplate = function(template) {
  if (window.markdownEditorInstance) {
    window.markdownEditorInstance.insertTemplate(template);
  }
};

// Initialize functionalities after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeThemeToggle();
  initializeKeyboardShortcuts();
  initializeFormShortcuts();
});

console.log('DevJournal App Initialized with Alpine, Theme Toggle, Shortcuts, and Form Submit');

import Alpine from 'alpinejs';
import "@phosphor-icons/web/regular";
import hljs from 'highlight.js';

// Theme toggle functionality
function initializeThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;
  const lightIcon = document.querySelector('.theme-icon-light');
  const darkIcon = document.querySelector('.theme-icon-dark');

  function applyTheme(theme) {
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      // Show sun icon, hide moon icon
      if (lightIcon) lightIcon.classList.add('hidden');
      if (darkIcon) darkIcon.classList.remove('hidden');
    } else {
      htmlElement.classList.remove('dark');
      // Show moon icon, hide sun icon
      if (lightIcon) lightIcon.classList.remove('hidden');
      if (darkIcon) darkIcon.classList.add('hidden');
    }
  }

  // Theme is already initialized in the head, just sync the icons
  const currentTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
  applyTheme(currentTheme);

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

// Function to initialize copy-to-clipboard for code blocks
function initializeCodeCopy() {
  // Find all code blocks
  const codeBlocks = document.querySelectorAll('pre.hljs');

  codeBlocks.forEach((block) => {
    // Skip if copy button already exists
    if (block.querySelector('.copy-button')) return;

    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500';
    copyButton.innerHTML = '<i class="ph ph-copy mr-1"></i>Copy';
    copyButton.setAttribute('aria-label', 'Copy code to clipboard');

    // Make the pre block relative and add group class for hover effects
    block.style.position = 'relative';
    block.classList.add('group');

    // Add copy functionality
    copyButton.addEventListener('click', async () => {
      const code = block.querySelector('code');
      if (!code) return;

      const textToCopy = code.textContent || code.innerText;

      try {
        // Use modern Clipboard API if available
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = textToCopy;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          textArea.remove();
        }

        // Show success feedback
        const originalContent = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="ph ph-check mr-1"></i>Copied!';
        copyButton.classList.add('bg-green-600', 'hover:bg-green-500');
        copyButton.classList.remove('bg-gray-700', 'hover:bg-gray-600', 'dark:bg-gray-600', 'dark:hover:bg-gray-500');

        // Reset after 2 seconds
        setTimeout(() => {
          copyButton.innerHTML = originalContent;
          copyButton.classList.remove('bg-green-600', 'hover:bg-green-500');
          copyButton.classList.add('bg-gray-700', 'hover:bg-gray-600', 'dark:bg-gray-600', 'dark:hover:bg-gray-500');
        }, 2000);

      } catch (err) {
        console.error('Failed to copy code: ', err);

        // Show error feedback
        const originalContent = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="ph ph-x mr-1"></i>Failed';
        copyButton.classList.add('bg-red-600', 'hover:bg-red-500');
        copyButton.classList.remove('bg-gray-700', 'hover:bg-gray-600', 'dark:bg-gray-600', 'dark:hover:bg-gray-500');

        // Reset after 2 seconds
        setTimeout(() => {
          copyButton.innerHTML = originalContent;
          copyButton.classList.remove('bg-red-600', 'hover:bg-red-500');
          copyButton.classList.add('bg-gray-700', 'hover:bg-gray-600', 'dark:bg-gray-600', 'dark:hover:bg-gray-500');
        }, 2000);
      }
    });

    // Add button to code block
    block.appendChild(copyButton);
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
        // Code blocks with language detection
        .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
          if (lang && hljs.getLanguage(lang)) {
            try {
              const highlighted = hljs.highlight(code.trim(), { language: lang }).value;
              return `<pre class="hljs"><code>${highlighted}</code></pre>`;
            } catch (e) {
              // Fall back to plain code if highlighting fails
            }
          }
          return `<pre class="hljs"><code>${code.trim()}</code></pre>`;
        })
        // Line breaks
        .replace(/\n/g, '<br>');

      // Wrap lists
      html = html.replace(/<li>.*<\/li><br><li>/g, (match) => {
        return '<ul>' + match;
      });
      html = html.replace(/<\/li><br>/g, '</li></ul><br>');

      this.preview = html;

      // Add copy buttons to preview code blocks after a short delay
      setTimeout(() => {
        initializeCodeCopy();
      }, 100);
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

// Global function to reinitialize code features (highlighting + copy buttons)
window.initializeCodeFeatures = function() {
  hljs.highlightAll();
  initializeCodeCopy();
};

// Initialize functionalities after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeThemeToggle();
  initializeKeyboardShortcuts();
  initializeFormShortcuts();
  initializeCodeCopy();

  // Initialize syntax highlighting for any existing code blocks
  hljs.highlightAll();

  // Initialize copy buttons for existing code blocks
  initializeCodeCopy();
});

console.log('DevJournal App Initialized with Alpine, Theme Toggle, Shortcuts, and Form Submit');

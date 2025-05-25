/**
 * EasyMDE Editor Alpine.js Component
 * Handles markdown editing with EasyMDE and rich text paste conversion
 */

import EasyMDE from 'easymde';
import TurndownService from 'turndown';

export function easyMDEEditorComponent() {
  return {
    content: '',
    editor: null,
    turndownService: null,

    init(initialContent = '') {
      this.content = initialContent;
      this.initializeTurndown();

      // Register this editor instance globally so templates can access it
      window.easyMDEEditorInstance = this;

      // Small delay to ensure DOM is ready
      this.$nextTick(() => {
        this.initializeEditor();
      });
    },

    initializeTurndown() {
      this.turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*',
        strongDelimiter: '**',
        linkStyle: 'inlined'
      });
    },

    initializeEditor() {
      const textarea = this.$refs.textarea;

      // Clean up any existing editor instance
      if (this.editor) {
        this.editor.toTextArea();
        this.editor = null;
      }

      // Set the initial content in the textarea
      textarea.value = this.content;

      this.editor = new EasyMDE({
        element: textarea,
        spellChecker: false,
        minHeight: '300px',
        maxHeight: '500px',
        placeholder: 'Start writing in Markdown...',
        toolbar: [
          'bold', 'italic', 'strikethrough', '|',
          'heading-1', 'heading-2', 'heading-3', '|',
          'code', 'quote', '|',
          'unordered-list', 'ordered-list', '|',
          'link', 'image', '|',
          'preview', 'fullscreen', '|',
          'guide'
        ],
        renderingConfig: {
          codeSyntaxHighlighting: true,
        },
        shortcuts: {
          togglePreview: 'Cmd-P',
          toggleFullScreen: 'F11'
        },
        status: ['lines', 'words', 'cursor'],
        forceSync: true,
        // Ensure the editor is editable
        readOnly: false,
        // Allow line wrapping
        lineWrapping: true
      });

      // Handle rich text paste events
      this.editor.codemirror.on('paste', (cm, e) => {
        // Only process if we have HTML content
        if (e.clipboardData && e.clipboardData.types.includes('text/html')) {
          e.preventDefault();

          // Get the HTML content from the clipboard
          const html = e.clipboardData.getData('text/html');

          // Convert HTML to Markdown using Turndown
          const markdown = this.turndownService.turndown(html);

          // Insert the converted Markdown at the cursor position
          cm.replaceSelection(markdown);

          return true;
        }
        return false;
      });

      // Track changes for unsaved changes detection
      this.editor.codemirror.on('change', () => {
        this.content = this.editor.value();
        window.formChanged = true;
      });

      // Handle Cmd/Ctrl + Enter to submit form
      this.editor.codemirror.on('keydown', (cm, e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          const form = this.$el.closest('form');
          if (form) {
            form.submit();
          }
        }
      });

      // Ensure the editor has the latest content after initialization
      if (this.content && this.content !== textarea.value) {
        this.editor.value(this.content);
      }
    },

    insertTemplate(template) {
      if (this.editor) {
        // Clean up the template content
        const cleanTemplate = template.trim();

        // Store the textarea reference
        const textarea = this.$refs.textarea;

        // Destroy the current editor
        this.editor.toTextArea();
        this.editor = null;

        // Set the content directly in the textarea
        textarea.value = cleanTemplate;

        // Recreate the editor with the new content
        this.initializeEditor();

        // Re-register the global reference immediately after recreation
        window.easyMDEEditorInstance = this;

        // Focus the new editor
        setTimeout(() => {
          if (this.editor && this.editor.codemirror) {
            this.editor.codemirror.focus();
            this.editor.codemirror.setCursor(0, 0);
          }
        }, 100);

        // Update the content property to keep it in sync
        this.content = cleanTemplate;

      } else {
        // If editor isn't ready yet, set the content and it will be applied when editor initializes
        this.content = template.trim();
        // Try again after a short delay
        setTimeout(() => {
          if (this.editor) {
            this.insertTemplate(template);
          }
        }, 100);
      }
    },

    getValue() {
      return this.editor ? this.editor.value() : this.content;
    },

    setValue(value) {
      if (this.editor) {
        this.editor.value(value);
      }
      this.content = value;
    },

    isReady() {
      return this.editor !== null;
    },

    destroy() {
      if (this.editor) {
        this.editor.toTextArea();
        this.editor = null;
      }
    }
  };
}
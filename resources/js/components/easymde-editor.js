/**
 * EasyMDE Editor Alpine.js Component
 * Handles markdown editing with EasyMDE and rich text paste conversion
 */

import EasyMDE from 'easymde';
import TurndownService from 'turndown';
import hljs from 'highlight.js';

export function easyMDEEditorComponent() {
  return {
    content: '',
    editor: null,
    turndownService: null,
    isInitialized: false,

    init(initialContent = '') {
      this.content = initialContent;
      this.initializeTurndown();

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
        linkStyle: 'inlined',
        // Add support for strikethrough and other GitHub flavored markdown
        preformattedCode: false
      });

      // Add custom rules for better conversion
      this.turndownService.addRule('strikethrough', {
        filter: ['del', 's', 'strike'],
        replacement: function (content) {
          return '~~' + content + '~~';
        }
      });

      // Handle code blocks better
      this.turndownService.addRule('codeBlock', {
        filter: function (node) {
          return node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE';
        },
        replacement: function (content, node) {
          const language = node.firstChild.className.replace(/^language-/, '') || '';
          return '\n\n```' + language + '\n' + node.firstChild.textContent + '\n```\n\n';
        }
      });
    },

    initializeEditor() {
      const textarea = this.$refs.textarea;

      if (!textarea) {
        console.error('EasyMDE: Textarea element not found');
        return;
      }

      // Clean up any existing editor instance
      if (this.editor) {
        this.editor.toTextArea();
        this.editor = null;
      }

      // Set the initial content in the textarea
      textarea.value = this.content;

      try {
        this.editor = new EasyMDE({
          element: textarea,
          spellChecker: false,
          minHeight: '300px',
          maxHeight: '500px',
          placeholder: 'Start writing in Markdown...',

          // Toolbar configuration optimized for developer journaling
          toolbar: [
            'bold', 'italic', 'strikethrough', '|',
            'heading-1', 'heading-2', 'heading-3', '|',
            'code', 'quote', '|',
            'unordered-list', 'ordered-list', '|',
            'link', 'image', '|',
            'table', 'horizontal-rule', '|',
            'guide'
          ],

          // Rendering configuration
          renderingConfig: {
            codeSyntaxHighlighting: true,
            hljs: hljs,
            singleLineBreaks: true, // GitHub flavored markdown
            sanitizerFunction: (renderedHTML) => {
              // Basic sanitization - you might want to use DOMPurify in production
              return renderedHTML;
            }
          },

          // Parsing configuration for better markdown support
          parsingConfig: {
            allowAtxHeaderWithoutSpace: false, // Enforce space after #
            strikethrough: true,
            underscoresBreakWords: false
          },

          // Status bar
          status: ['lines', 'words', 'cursor'],

          // Sync settings
          forceSync: true,

          // Editor settings
          readOnly: false,
          lineWrapping: true,
          indentWithTabs: false,
          tabSize: 2,

          // Block styles for consistency
          blockStyles: {
            bold: '**',
            italic: '*',
            code: '```'
          },

          // Insert text configurations
          insertTexts: {
            horizontalRule: ['', '\n\n---\n\n'],
            image: ['![Alt text](', ')'],
            link: ['[Link text](', ')'],
            table: ['', '\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text     | Text     |\n\n']
          },

          // Error handling
          errorCallback: (errorMessage) => {
            console.error('EasyMDE Error:', errorMessage);
            // You could show a toast notification here
          }
        });

        // Handle rich text paste events
        this.editor.codemirror.on('paste', (cm, e) => {
          // Only process if we have HTML content
          if (e.clipboardData && e.clipboardData.types.includes('text/html')) {
            e.preventDefault();

            try {
              // Get the HTML content from the clipboard
              const html = e.clipboardData.getData('text/html');

              // Convert HTML to Markdown using Turndown
              const markdown = this.turndownService.turndown(html);

              // Insert the converted Markdown at the cursor position
              cm.replaceSelection(markdown);

              return true;
            } catch (error) {
              console.error('Error converting pasted HTML to Markdown:', error);
              // Fall back to plain text
              const plainText = e.clipboardData.getData('text/plain');
              if (plainText) {
                cm.replaceSelection(plainText);
              }
            }
          }
          return false;
        });

        // Track changes for unsaved changes detection
        this.editor.codemirror.on('change', () => {
          this.content = this.editor.value();
          window.formChanged = true;

          // Dispatch custom event for unsaved changes module
          document.dispatchEvent(new CustomEvent('easymde:change', {
            detail: { content: this.content }
          }));
        });

        // Handle Cmd/Ctrl + S to save form
        this.editor.codemirror.on('keydown', (cm, e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const form = this.$el.closest('form');
            if (form) {
              // Trigger form submission via the AJAX form component if available
              const ajaxFormElement = form.closest('[x-data*="ajaxForm"]');
              if (ajaxFormElement && ajaxFormElement._x_dataStack) {
                const ajaxFormData = ajaxFormElement._x_dataStack[0];
                if (ajaxFormData && ajaxFormData.submitForm) {
                  ajaxFormData.submitForm(e);
                  return;
                }
              }
              // Fallback to regular form submission
              form.submit();
            }
          }
        });

        // Handle editor focus/blur for better UX
        this.editor.codemirror.on('focus', () => {
          this.$el.classList.add('editor-focused');
        });

        this.editor.codemirror.on('blur', () => {
          this.$el.classList.remove('editor-focused');
        });

        // Ensure the editor has the latest content after initialization
        if (this.content && this.content !== textarea.value) {
          this.editor.value(this.content);
        }

        // Register this editor instance globally so templates can access it
        // Only set this after the editor is fully initialized and ready
        window.easyMDEEditorInstance = this;
        this.isInitialized = true;

        // Dispatch ready event for unsaved changes module
        document.dispatchEvent(new CustomEvent('easymde:ready', {
          detail: { instance: this }
        }));

      } catch (error) {
        console.error('Failed to initialize EasyMDE editor:', error);
        // Fallback: show the textarea
        textarea.style.display = 'block';
      }
    },

    insertTemplate(template) {
      if (!this.isInitialized || !this.editor) {
        // If editor isn't ready yet, set the content and it will be applied when editor initializes
        this.content = template.trim();
        // Try again after a short delay
        setTimeout(() => {
          if (this.editor) {
            this.insertTemplate(template);
          }
        }, 100);
        return;
      }

      try {
        // Clean up the template content
        const cleanTemplate = template.trim();

        // Store the textarea reference
        const textarea = this.$refs.textarea;

        // Destroy the current editor
        this.editor.toTextArea();
        this.editor = null;
        this.isInitialized = false;

        // Set the content directly in the textarea
        textarea.value = cleanTemplate;

        // Recreate the editor with the new content
        this.initializeEditor();

        // Focus the new editor
        setTimeout(() => {
          if (this.editor && this.editor.codemirror) {
            this.editor.codemirror.focus();
            // Position cursor at the end of the first line (after title)
            const lines = cleanTemplate.split('\n');
            if (lines.length > 0) {
              this.editor.codemirror.setCursor(0, lines[0].length);
            }
          }
        }, 100);

        // Update the content property to keep it in sync
        this.content = cleanTemplate;

      } catch (error) {
        console.error('Error inserting template:', error);
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
      return this.isInitialized && this.editor !== null;
    },

    destroy() {
      if (this.editor) {
        this.editor.toTextArea();
        this.editor = null;
      }
      this.isInitialized = false;

      // Clean up global reference
      if (window.easyMDEEditorInstance === this) {
        window.easyMDEEditorInstance = null;
      }
    }
  };
}

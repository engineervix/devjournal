/**
 * Markdown Editor Alpine.js Component
 * Handles markdown editing with live preview functionality
 */

import { renderMarkdownToHtml } from '../modules/markdown.js';
import { initializeCodeCopy } from '../modules/code-features.js';

export function markdownEditorComponent() {
  return {
    content: '',
    activeTab: 'write',
    preview: 'Loading preview...',

    init(initialContent = '') {
      this.content = initialContent;
      // Register this editor instance globally so templates can access it
      window.markdownEditorInstance = this;
    },

    renderPreview() {
      // Use the extracted markdown rendering utility
      this.preview = renderMarkdownToHtml(this.content);

      // Add copy buttons to preview code blocks after a short delay
      setTimeout(() => {
        initializeCodeCopy();
      }, 100);
    },

    insertTemplate(template) {
      this.content = template;
      this.activeTab = 'write';
    }
  };
}

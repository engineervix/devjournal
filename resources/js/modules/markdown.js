/**
 * Markdown Utilities Module
 * Handles markdown rendering and processing
 */

import hljs from 'highlight.js';

export function renderMarkdownToHtml(content) {
  if (content.trim() === '') {
    return '<p class="text-gray-500">Nothing to preview</p>';
  }

  // Simple markdown formatting (this is just a basic example)
  let html = content
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

  return html;
}

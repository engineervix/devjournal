/**
 * Global Utility Functions
 * Functions that need to be available globally across the application
 */

import { initializeCodeFeatures } from '../modules/code-features.js'

// Global function to insert template into markdown editor
window.insertTemplate = function (template) {
  if (
    window.easyMDEEditorInstance &&
    window.easyMDEEditorInstance.editor &&
    window.easyMDEEditorInstance.editor.codemirror
  ) {
    window.easyMDEEditorInstance.insertTemplate(template)
  } else {
    // If editor instance isn't available yet, try again after a short delay
    setTimeout(() => {
      if (
        window.easyMDEEditorInstance &&
        window.easyMDEEditorInstance.editor &&
        window.easyMDEEditorInstance.editor.codemirror
      ) {
        window.easyMDEEditorInstance.insertTemplate(template)
      } else {
        console.warn('EasyMDE editor instance not found or not ready. Template insertion failed.')
      }
    }, 200)
  }
}

/**
 * Smart template insertion that simulates double-click behavior
 *
 * This function works around a timing issue where the EasyMDE editor
 * sometimes requires two clicks to insert templates properly:
 * - First click: Restores focus to the editor
 * - Second click: Actually inserts the template
 *
 * This function automatically handles both steps in a single click by:
 * 1. Attempting template insertion immediately
 * 2. Checking if the content changed after a delay
 * 3. Retrying if the first attempt didn't work
 *
 * @param {string} template - The template content to insert
 */
window.insertTemplateWithRetry = function (template) {
  // Store the current content to check if insertion worked
  const currentContent = window.easyMDEEditorInstance
    ? window.easyMDEEditorInstance.editor
      ? window.easyMDEEditorInstance.editor.value()
      : ''
    : ''

  // First attempt - this might just restore focus
  window.insertTemplate(template)

  // Check if it worked after a short delay, if not try again
  // This simulates the "second click" that actually inserts the template
  setTimeout(() => {
    const newContent = window.easyMDEEditorInstance
      ? window.easyMDEEditorInstance.editor
        ? window.easyMDEEditorInstance.editor.value()
        : ''
      : ''

    // If content didn't change, the first attempt failed - try again
    if (newContent === currentContent) {
      window.insertTemplate(template)
    }
  }, 100)
}

// Global function to reinitialize code features (highlighting + copy buttons)
window.initializeCodeFeatures = function () {
  initializeCodeFeatures()
}

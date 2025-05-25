/**
 * Global Utility Functions
 * Functions that need to be available globally across the application
 */

import { initializeCodeFeatures } from '../modules/code-features.js';

// Global function to insert template into markdown editor
window.insertTemplate = function(template) {
  if (window.markdownEditorInstance) {
    window.markdownEditorInstance.insertTemplate(template);
  }
};

// Global function to reinitialize code features (highlighting + copy buttons)
window.initializeCodeFeatures = function() {
  initializeCodeFeatures();
};

/**
 * Global Utility Functions
 * Functions that need to be available globally across the application
 */

import { initializeCodeFeatures } from '../modules/code-features.js';

// Global function to insert template into markdown editor
window.insertTemplate = function(template) {
  if (window.easyMDEEditorInstance) {
    window.easyMDEEditorInstance.insertTemplate(template);
  } else {
    // If editor instance isn't available yet, try again after a short delay
    setTimeout(() => {
      if (window.easyMDEEditorInstance) {
        window.easyMDEEditorInstance.insertTemplate(template);
      } else {
        console.warn('EasyMDE editor instance not found. Template insertion failed.');
      }
    }, 200);
  }
};

// Global function to reinitialize code features (highlighting + copy buttons)
window.initializeCodeFeatures = function() {
  initializeCodeFeatures();
};

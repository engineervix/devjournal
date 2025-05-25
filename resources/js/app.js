/**
 * DevJournal Main Application Entry Point
 * Imports and initializes all modules and components
 */

import Alpine from 'alpinejs';
import "@phosphor-icons/web/regular";

// Import modules
import { initializeThemeToggle } from './modules/theme.js';
import { initializeKeyboardShortcuts, initializeFormShortcuts } from './modules/shortcuts.js';
import { initializeCodeFeatures } from './modules/code-features.js';

// Import Alpine.js components
import { userMenuComponent } from './components/user-menu.js';
import { mobileMenuComponent } from './components/mobile-menu.js';
import { markdownEditorComponent } from './components/markdown-editor.js';
import { tagInputComponent } from './components/tag-input.js';

// Import global utilities
import './utils/globals.js';

// Register Alpine.js components
document.addEventListener('alpine:init', () => {
  Alpine.data('userMenu', userMenuComponent);
  Alpine.data('mobileMenu', mobileMenuComponent);
  Alpine.data('markdownEditor', markdownEditorComponent);
  Alpine.data('tagInput', tagInputComponent);
});

// Initialize Alpine.js
window.Alpine = Alpine;
Alpine.start();

// Initialize all modules after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeThemeToggle();
  initializeKeyboardShortcuts();
  initializeFormShortcuts();
  initializeCodeFeatures();
});

/**
 * DevJournal Main Application Entry Point
 * Imports and initializes all modules and components
 */

import Alpine from 'alpinejs'
import '@phosphor-icons/web/regular'

// Import platform detection utility
import './utils/platform.js'

// Import modules
import { initializeThemeToggle } from './modules/theme.js'
import { initializeKeyboardShortcuts, initializeFormShortcuts } from './modules/shortcuts.js'
import { initializeCodeFeatures } from './modules/code-features.js'
import { initializeUnsavedChangesProtection } from './modules/unsaved-changes.js'

// Import Alpine.js components
import { userMenuComponent } from './components/user-menu.js'
import { mobileMenuComponent } from './components/mobile-menu.js'
import { easyMDEEditorComponent } from './components/easymde-editor.js'
import { tagInputComponent } from './components/tag-input.js'
import { ajaxFormComponent } from './components/ajax-form.js'
import { clickableCardComponent } from './components/clickable-card.js'

// Import global utilities
import './utils/globals.js'

// Register Alpine.js components
document.addEventListener('alpine:init', () => {
  Alpine.data('userMenu', userMenuComponent)
  Alpine.data('mobileMenu', mobileMenuComponent)
  Alpine.data('easyMDEEditor', easyMDEEditorComponent)
  Alpine.data('tagInput', tagInputComponent)
  Alpine.data('ajaxForm', ajaxFormComponent)
  Alpine.data('clickableCard', clickableCardComponent)
})

// Initialize Alpine.js
window.Alpine = Alpine
Alpine.start()

// Initialize all modules after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeThemeToggle()
  initializeKeyboardShortcuts()
  initializeFormShortcuts()
  initializeCodeFeatures()
  initializeUnsavedChangesProtection()
})

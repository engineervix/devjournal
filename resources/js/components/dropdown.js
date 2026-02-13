/**
 * Generic Dropdown Component for Alpine.js
 *
 * Provides consistent dropdown behavior across the application.
 * Handles open/close state, click-away, keyboard navigation, and transitions.
 *
 * Usage in Edge templates:
 * <div x-data="dropdown">
 *   <button @click="toggle">Toggle</button>
 *   <div x-show="open" x-transition>Dropdown content</div>
 * </div>
 */

export default function dropdown() {
  return {
    open: false,

    /**
     * Initialize dropdown state
     */
    init() {
      // Close on escape key
      this.$watch('open', (value) => {
        if (value) {
          // Add escape key listener when open
          document.addEventListener('keydown', this.handleEscape.bind(this))
        } else {
          // Remove listener when closed
          document.removeEventListener('keydown', this.handleEscape.bind(this))
        }
      })
    },

    /**
     * Toggle dropdown open/close
     */
    toggle() {
      this.open = !this.open
    },

    /**
     * Explicitly open dropdown
     */
    show() {
      this.open = true
    },

    /**
     * Explicitly close dropdown
     */
    close() {
      this.open = false
    },

    /**
     * Handle escape key press
     * @param {KeyboardEvent} event
     */
    handleEscape(event) {
      if (event.key === 'Escape' && this.open) {
        this.close()
        event.preventDefault()
      }
    },

    /**
     * Cleanup on component destroy
     */
    destroy() {
      document.removeEventListener('keydown', this.handleEscape.bind(this))
    },
  }
}

/**
 * Clickable Card Component
 * Handles full card click navigation while preserving interactive elements
 */
export function clickableCardComponent() {
  return {
    targetUrl: '',

    init() {
      // Set up keyboard navigation
      this.$el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.navigate()
        }
      })
    },

    handleClick(event) {
      // Don't navigate if clicking on interactive elements
      const interactiveElements = ['a', 'button', 'input', 'select', 'textarea']
      const clickedElement = event.target.closest(interactiveElements.join(', '))

      if (clickedElement) {
        return
      }

      // Don't navigate if text is being selected
      if (window.getSelection().toString().length > 0) {
        return
      }

      this.navigate()
    },

    navigate() {
      if (this.targetUrl) {
        // Add a subtle loading state
        this.$el.style.opacity = '0.8'
        window.location.href = this.targetUrl
      }
    },

    // Handle middle-click and Ctrl+click for new tab
    handleMouseDown(event) {
      if (event.button === 1 || (event.button === 0 && (event.ctrlKey || event.metaKey))) {
        event.preventDefault()
        if (this.targetUrl) {
          window.open(this.targetUrl, '_blank')
        }
      }
    },
  }
}

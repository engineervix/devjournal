/**
 * Tag Input Alpine.js Component
 * Handles tag input with autocomplete functionality
 */

export function tagInputComponent(suggestions = [], initialSelected = []) {
  return {
    inputValue: '',
    suggestions: suggestions,
    selected: initialSelected,
    filteredSuggestions: [],
    showSuggestions: false,
    selectedSuggestionIndex: 0,

    filterSuggestions() {
      if (this.inputValue.trim() === '') {
        this.filteredSuggestions = []
        this.showSuggestions = false
        return
      }

      this.filteredSuggestions = this.suggestions
        .filter(
          (tag) =>
            tag.toLowerCase().includes(this.inputValue.toLowerCase()) &&
            !this.selected.includes(tag)
        )
        .slice(0, 5)

      this.showSuggestions = this.filteredSuggestions.length > 0
      this.selectedSuggestionIndex = 0
    },

    addTag() {
      if (this.inputValue.trim() === '') return

      if (this.showSuggestions && this.selectedSuggestionIndex >= 0) {
        this.selectSuggestion(this.filteredSuggestions[this.selectedSuggestionIndex])
        return
      }

      const newTag = this.inputValue.trim()
      if (!this.selected.includes(newTag)) {
        this.selected.push(newTag)
      }

      this.inputValue = ''
      this.showSuggestions = false
    },

    removeTag(index) {
      this.selected.splice(index, 1)
    },

    selectSuggestion(suggestion) {
      if (!this.selected.includes(suggestion)) {
        this.selected.push(suggestion)
      }

      this.inputValue = ''
      this.showSuggestions = false
    },

    navigateSuggestion(step) {
      if (!this.showSuggestions) return

      const max = this.filteredSuggestions.length - 1
      const next = this.selectedSuggestionIndex + step

      if (next < 0) {
        this.selectedSuggestionIndex = max
      } else if (next > max) {
        this.selectedSuggestionIndex = 0
      } else {
        this.selectedSuggestionIndex = next
      }
    },
  }
}

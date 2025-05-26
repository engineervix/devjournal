/**
 * AJAX Form Alpine.js Component
 * Handles form submission via AJAX for seamless entry saving
 */

export function ajaxFormComponent() {
  return {
    isSubmitting: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    entryId: null,
    isEditMode: false,

    init() {
      // Determine if we're in edit mode based on the form action
      const form = this.$refs.form;
      if (form) {
        const action = form.getAttribute('action');
        this.isEditMode = action && action.includes('/entries/') && !action.includes('/entries/store');

        // Extract entry ID from the action URL if in edit mode
        if (this.isEditMode) {
          const matches = action.match(/\/entries\/([^\/\?]+)/);
          if (matches) {
            this.entryId = matches[1];
          }
        }
      }

      // Listen for content changes from EasyMDE
      document.addEventListener('easymde:change', () => {
        this.hasUnsavedChanges = true;
      });

      // Listen for other form field changes
      this.$refs.form.addEventListener('input', () => {
        this.hasUnsavedChanges = true;
      });

      // Auto-save functionality (optional - can be enabled later)
      // this.startAutoSave();
    },

    async submitForm(event) {
      event.preventDefault();

      if (this.isSubmitting) {
        return;
      }

      this.isSubmitting = true;

      // Notify the unsaved changes module that we're submitting
      if (window.unsavedChanges) {
        if (window.unsavedChanges.setSubmitting) {
          window.unsavedChanges.setSubmitting(true);
        }
        if (window.unsavedChanges.setUnsavedChanges) {
          window.unsavedChanges.setUnsavedChanges(false);
        }
      }

      try {
        const formData = new FormData(this.$refs.form);

        // Get content from EasyMDE editor
        const easyMDEComponent = this.$refs.easyMDEEditor;
        if (easyMDEComponent && easyMDEComponent._x_dataStack) {
          const editorData = easyMDEComponent._x_dataStack[0];
          if (editorData && editorData.getValue) {
            formData.set('contentMarkdown', editorData.getValue());
          }
        }

        // Get tags from tag input component
        const tagInputComponent = this.$refs.tagInput;
        if (tagInputComponent && tagInputComponent._x_dataStack) {
          const tagData = tagInputComponent._x_dataStack[0];
          if (tagData && tagData.selectedTags) {
            // Remove existing tag entries
            formData.delete('tags');
            // Add each tag
            tagData.selectedTags.forEach(tag => {
              formData.append('tags', tag);
            });
          }
        }

        // Determine the endpoint URL
        const url = this.isEditMode
          ? `/entries/${this.entryId}/ajax`
          : '/entries/ajax';

        const method = this.isEditMode ? 'PUT' : 'POST';

        // Convert FormData to URLSearchParams for proper handling
        const params = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
          params.append(key, value);
        }

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: params
        });

        const result = await response.json();

        if (result.success) {
          this.handleSuccess(result);
        } else {
          this.handleError(result);
        }

      } catch (error) {
        console.error('Form submission error:', error);
        this.showNotification('An error occurred while saving. Please try again.', 'error');
      } finally {
        this.isSubmitting = false;

        // Reset submitting state in unsaved changes module
        if (window.unsavedChanges && window.unsavedChanges.setSubmitting) {
          window.unsavedChanges.setSubmitting(false);
        }
      }
    },

    handleSuccess(result) {
      this.hasUnsavedChanges = false;
      this.lastSaved = new Date();

      // Update entry ID if we were creating a new entry
      if (!this.isEditMode && result.entry && result.entry.id) {
        this.entryId = result.entry.id;
        this.isEditMode = true;

        // Update the form action to point to the update endpoint
        const form = this.$refs.form;
        if (form) {
          form.setAttribute('action', `/entries/${this.entryId}?_method=PUT`);
        }

        // Update the browser URL without reloading the page
        const newUrl = `/entries/${this.entryId}/edit`;
        window.history.replaceState({}, '', newUrl);
      }

      this.showNotification(result.message || 'Entry saved successfully!', 'success');

      // Reset form changed flag
      window.formChanged = false;

      // Notify the unsaved changes module that changes have been saved
      if (window.unsavedChanges && window.unsavedChanges.clearUnsavedChanges) {
        window.unsavedChanges.clearUnsavedChanges();
      }

      // Also dispatch the custom event for the unsaved changes module
      document.dispatchEvent(new CustomEvent('unsavedChanges', {
        detail: { hasUnsavedChanges: false }
      }));
    },

    handleError(result) {
      let errorMessage = result.message || 'An error occurred while saving.';

      if (result.errors && Array.isArray(result.errors)) {
        errorMessage = result.errors.map(error => error.message).join(', ');
      }

      this.showNotification(errorMessage, 'error');
    },

    showNotification(message, type = 'info') {
      // Create a simple notification
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
      }`;
      notification.textContent = message;

      document.body.appendChild(notification);

      // Animate in
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
      }, 10);

      // Remove after 5 seconds
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 5000);
    },

    getLastSavedText() {
      if (!this.lastSaved) {
        return '';
      }

      const now = new Date();
      const diff = Math.floor((now - this.lastSaved) / 1000);

      if (diff < 60) {
        return 'Saved just now';
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else {
        const hours = Math.floor(diff / 3600);
        return `Saved ${hours} hour${hours > 1 ? 's' : ''} ago`;
      }
    },

    // Auto-save functionality (can be enabled later)
    startAutoSave() {
      setInterval(() => {
        if (this.hasUnsavedChanges && !this.isSubmitting) {
          this.submitForm(new Event('submit'));
        }
      }, 30000); // Auto-save every 30 seconds
    }
  };
}

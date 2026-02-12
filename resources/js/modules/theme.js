/**
 * Theme Management Module
 * Handles dark/light theme toggling and persistence
 */

export function initializeThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle')
  const htmlElement = document.documentElement
  const lightIcon = document.querySelector('.theme-icon-light')
  const darkIcon = document.querySelector('.theme-icon-dark')

  function applyTheme(theme) {
    if (theme === 'dark') {
      htmlElement.classList.add('dark')
      // Show sun icon, hide moon icon
      if (lightIcon) lightIcon.classList.add('hidden')
      if (darkIcon) darkIcon.classList.remove('hidden')
    } else {
      htmlElement.classList.remove('dark')
      // Show moon icon, hide sun icon
      if (lightIcon) lightIcon.classList.remove('hidden')
      if (darkIcon) darkIcon.classList.add('hidden')
    }
  }

  // Theme is already initialized in the head, just sync the icons
  const currentTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light'
  applyTheme(currentTheme)

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = htmlElement.classList.contains('dark')
      const newTheme = isDark ? 'light' : 'dark'
      localStorage.setItem('theme', newTheme)
      applyTheme(newTheme)
    })
  }
}

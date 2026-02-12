/**
 * Code Features Module
 * Handles syntax highlighting and copy-to-clipboard functionality for code blocks
 */

import hljs from 'highlight.js'

export function initializeCodeCopy() {
  // Find all code blocks
  const codeBlocks = document.querySelectorAll('pre.hljs')

  codeBlocks.forEach((block) => {
    // Skip if copy button already exists
    if (block.querySelector('.copy-button')) return

    // Create copy button
    const copyButton = document.createElement('button')
    copyButton.className =
      'copy-button absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
    copyButton.innerHTML = '<i class="ph ph-copy mr-1"></i>Copy'
    copyButton.setAttribute('aria-label', 'Copy code to clipboard')

    // Make the pre block relative and add group class for hover effects
    block.style.position = 'relative'
    block.classList.add('group')

    // Add copy functionality
    copyButton.addEventListener('click', async () => {
      const code = block.querySelector('code')
      if (!code) return

      const textToCopy = code.textContent || code.innerText

      try {
        // Use modern Clipboard API if available
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(textToCopy)
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea')
          textArea.value = textToCopy
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          textArea.style.top = '-999999px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          document.execCommand('copy')
          textArea.remove()
        }

        // Show success feedback
        const originalContent = copyButton.innerHTML
        copyButton.innerHTML = '<i class="ph ph-check mr-1"></i>Copied!'
        copyButton.classList.add('bg-green-600', 'hover:bg-green-500')
        copyButton.classList.remove(
          'bg-gray-700',
          'hover:bg-gray-600',
          'dark:bg-gray-600',
          'dark:hover:bg-gray-500'
        )

        // Reset after 2 seconds
        setTimeout(() => {
          copyButton.innerHTML = originalContent
          copyButton.classList.remove('bg-green-600', 'hover:bg-green-500')
          copyButton.classList.add(
            'bg-gray-700',
            'hover:bg-gray-600',
            'dark:bg-gray-600',
            'dark:hover:bg-gray-500'
          )
        }, 2000)
      } catch (err) {
        console.error('Failed to copy code: ', err)

        // Show error feedback
        const originalContent = copyButton.innerHTML
        copyButton.innerHTML = '<i class="ph ph-x mr-1"></i>Failed'
        copyButton.classList.add('bg-red-600', 'hover:bg-red-500')
        copyButton.classList.remove(
          'bg-gray-700',
          'hover:bg-gray-600',
          'dark:bg-gray-600',
          'dark:hover:bg-gray-500'
        )

        // Reset after 2 seconds
        setTimeout(() => {
          copyButton.innerHTML = originalContent
          copyButton.classList.remove('bg-red-600', 'hover:bg-red-500')
          copyButton.classList.add(
            'bg-gray-700',
            'hover:bg-gray-600',
            'dark:bg-gray-600',
            'dark:hover:bg-gray-500'
          )
        }, 2000)
      }
    })

    // Add button to code block
    block.appendChild(copyButton)
  })
}

export function initializeCodeFeatures() {
  hljs.highlightAll()
  initializeCodeCopy()
}

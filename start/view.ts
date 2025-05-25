import edge from 'edge.js'
import { HttpContext } from '@adonisjs/core/http' // Import HttpContext for request type

/**
 * Defines a global 'constructUrl' function for Edge templates.
 * This function takes newParams object, merges it with existing
 * query parameters from the current request, and returns a new URL string.
 */
edge.global('constructUrl', (newParams: Record<string, any>) => {
  // HttpContext.get() is a way to get the current HTTP context
  // if it's not directly available in the scope.
  // However, 'request' is typically globally available in Edge via AdonisJS.
  const ctx = HttpContext.get()
  if (!ctx) {
    // Fallback or error handling if context is not available
    // This might indicate the helper is used outside a request lifecycle
    console.error('HttpContext not available in constructUrl helper')
    const currentBaseUrl = edge.globals.route('entries.index')
    const queryString = new URLSearchParams(newParams).toString()
    return `${currentBaseUrl}${queryString ? `?${queryString}` : ''}`
  }

  const request = ctx.request
  const currentParams = request.qs()

  // Merge current params with new ones
  const mergedParams = { ...currentParams, ...newParams }

  // Remove null/undefined params
  Object.keys(mergedParams).forEach(
    (key) =>
      (mergedParams[key] === null || mergedParams[key] === undefined || mergedParams[key] === '') &&
      delete mergedParams[key]
  )

  // Build query string
  const queryString = new URLSearchParams(mergedParams).toString()
  // Use Edge's route global to construct the base URL
  const baseUrl = edge.globals.route('entries.index')
  return `${baseUrl}${queryString ? `?${queryString}` : ''}`
})

/**
 * Defines a global 'range' function for Edge templates.
 * This function generates an array of numbers within a specified range.
 */
edge.global('range', (start: number, end: number) => {
  return Array.from({ length: end - start }, (_, i) => start + i)
})

/**
 * Defines a global 'formatDateWithDay' function for Edge templates.
 * This function formats Luxon DateTime objects with day of the week included.
 */
edge.global(
  'formatDateWithDay',
  (dateTime: any, format: 'short' | 'medium' | 'long' = 'medium') => {
    if (!dateTime || typeof dateTime.toFormat !== 'function') {
      return ''
    }

    switch (format) {
      case 'short':
        // For compact displays: "Mon, May 25, 2025"
        return dateTime.toFormat('ccc, LLL dd, yyyy')
      case 'medium':
        // For entry cards: "Mon, May 25, 2025 at 1:02 AM"
        return dateTime.toFormat("ccc, LLL dd, yyyy 'at' h:mm a")
      case 'long':
        // For detailed views: "Monday, May 25, 2025 14:02"
        return dateTime.toFormat('cccc, LLLL dd, yyyy HH:mm')
      default:
        return dateTime.toFormat("ccc, LLL dd, yyyy 'at' h:mm a")
    }
  }
)

// If you have other global view configurations, they would go here.
// For example, from the docs:
// import env from '#start/env'
// edge.global('appUrl', env.get('APP_URL'))

// If you use edge-iconify or other plugins:
// import { edgeIconify } from 'edge-iconify'
// edge.use(edgeIconify)

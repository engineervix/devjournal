/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import User from '#models/user'
const EntriesController = () => import('#controllers/entries_controller')

router
  .get('/', async ({ view }) => {
    return view.render('pages/login')
  })
  .as('auth.login.show')
  .use(middleware.guest())

router
  .post('/', async ({ request, response, auth, session }) => {
    const { email, password } = request.only(['email', 'password'])
    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)
      return response.redirect('/home')
    } catch (error) {
      session.flash('error', 'Invalid credentials')
      return response.redirect().back()
    }
  })
  .as('auth.login')
  .use(middleware.guest())

router
  .get('/home', async ({ view, auth }) => {
    const { DateTime } = await import('luxon')
    const entryMod = await import('#models/entry')
    const tagMod = await import('#models/tag')
    const Entry = entryMod.default
    const Tag = tagMod.default
    const user = await auth.getUserOrFail()
    const today = DateTime.now().startOf('day')
    const tomorrow = today.plus({ days: 1 })

    // Today's entries
    const todayEntries = await Entry.query()
      .where('user_id', user.id)
      .where('created_at', '>=', today.toISO())
      .where('created_at', '<', tomorrow.toISO())
      .orderBy('created_at', 'desc')
      .preload('tags')

    // Has daily log today?
    const hasDailyLog = todayEntries.some((e) => e.entryType === 'daily')

    // Entry stats
    const totalCountResult = await Entry.query().where('user_id', user.id).count('* as total')
    const totalCount = Number(totalCountResult[0]?.$extras?.total || 0)
    const todayCount = todayEntries.length

    // Streak calculation (consecutive days with at least one entry)
    let streak = 0
    const recentEntries = await Entry.query()
      .where('user_id', user.id)
      .where('created_at', '>=', today.minus({ days: 365 }).toISO()) // Only check last year
      .orderBy('created_at', 'desc')

    // Group entries by date
    const entriesByDate = new Map<string, boolean>()
    for (const entry of recentEntries) {
      const dateKey = entry.createdAt.toISODate()
      if (dateKey) {
        entriesByDate.set(dateKey, true)
      }
    }

    // Calculate streak from today backwards
    let streakDate = today
    while (entriesByDate.has(streakDate.toISODate()!)) {
      streak++
      streakDate = streakDate.minus({ days: 1 })
    }

    // Most used tag
    const topTag = await Tag.query().orderBy('usage_count', 'desc').first()

    // Recent achievements (last 5)
    const achievements = await Entry.query()
      .where('user_id', user.id)
      .where('entry_type', 'achievement')
      .orderBy('created_at', 'desc')
      .limit(5)

    // Popular tags (top 10)
    const popularTags = await Tag.query().orderBy('usage_count', 'desc').limit(10)

    const stats = {
      todayCount,
      streak,
      totalCount,
      topTag,
    }
    const currentDate = DateTime.now()

    return view.render('pages/dashboard', {
      currentDate,
      stats,
      todayEntries,
      achievements,
      popularTags,
      hasDailyLog,
    })
  })
  .as('home')
  .use(middleware.auth())

router
  .post('/logout', async ({ auth, response }) => {
    await auth.use('web').logout()
    return response.redirect('/')
  })
  .as('auth.logout')
  .use(middleware.auth())

// Entry routes
router
  .group(() => {
    // Search entries
    router.get('/entries/search', [EntriesController, 'search']).as('entries.search')

    // Export entries
    router.get('/entries/export', [EntriesController, 'export']).as('entries.export')

    // Tags cloud view
    router.get('/tags', [EntriesController, 'tags']).as('tags.index')

    // AJAX endpoints for entries
    router.post('/entries/ajax', [EntriesController, 'storeAjax']).as('entries.store.ajax')
    router.put('/entries/:id/ajax', [EntriesController, 'updateAjax']).as('entries.update.ajax')

    // Restrict entry ID parameter to valid UUIDs only
    // This prevents static files (like installHook.js.map from browser extensions)
    // from being incorrectly routed to the entries controller
    router
      .resource('entries', EntriesController)
      .where('id', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

    // Filter entries by tag
    router.get('/tags/:slug', [EntriesController, 'byTag']).as('entries.byTag')
  })
  .use(middleware.auth())

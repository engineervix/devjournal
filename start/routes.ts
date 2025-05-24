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
      .orderBy('created_at', 'asc')
      .preload('tags')

    // Has daily log today?
    const hasDailyLog = todayEntries.some((e) => e.entryType === 'daily')

    // Entry stats
    const totalCountResult = await Entry.query().where('user_id', user.id).count('* as total')
    const totalCount = Number(totalCountResult[0]?.$extras?.total || 0)
    const todayCount = todayEntries.length

    // Streak calculation (consecutive days with at least one entry)
    let streak = 0
    let day = today
    while (true) {
      const countResult = await Entry.query()
        .where('user_id', user.id)
        .where('created_at', '>=', day.toISO())
        .where('created_at', '<', day.plus({ days: 1 }).toISO())
        .count('* as total')
      const count = Number(countResult[0]?.$extras?.total || 0)
      if (count > 0) {
        streak++
        day = day.minus({ days: 1 })
      } else {
        break
      }
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
    const currentDate = DateTime.now().toFormat('MMMM d, yyyy')

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

    router.resource('entries', EntriesController)

    // Filter entries by tag
    router.get('/tags/:slug', [EntriesController, 'byTag']).as('entries.byTag')
  })
  .use(middleware.auth())

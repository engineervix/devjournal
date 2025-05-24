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
    const currentDate = DateTime.now().toFormat('MMMM d, yyyy')

    // Sample data - you'll need to implement the actual queries
    const stats = {
      todayCount: 3,
      streak: 7,
      totalCount: 42,
      topTag: { name: 'javascript', usageCount: 15 },
    }

    const todayEntries = [] // Replace with actual entries query
    const achievements = [] // Replace with actual achievements query
    const popularTags = [] // Replace with actual popular tags query
    const hasDailyLog = false // Replace with check for daily log

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
    router.resource('entries', EntriesController)

    // Search entries
    router.get('/entries/search', [EntriesController, 'search']).as('entries.search')

    // Filter entries by tag
    router.get('/tags/:slug', [EntriesController, 'byTag']).as('entries.byTag')
  })
  .use(middleware.auth())

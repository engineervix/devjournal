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
  .get('/home', async ({ view }) => {
    return view.render('pages/home')
  })
  .use(middleware.auth())

router
  .post('/logout', async ({ auth, response }) => {
    await auth.use('web').logout()
    return response.redirect('/')
  })
  .as('auth.logout')
  .use(middleware.auth())

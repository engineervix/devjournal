import { test } from '@japa/runner'
import { assert } from '@japa/assert'
import { ApiClient } from '@japa/api-client'
import User from '#models/user'
import { truncateTables, createUser } from '#tests/helpers/database'
import { getAuthenticatedClient } from '#tests/helpers/api'
import app from '@adonisjs/core/services/app'

test.group('Auth', (group) => {
  let apiClient: ApiClient

  group.setup(async () => {
    apiClient = new ApiClient(await app.handle(null))
  })

  group.each.setup(async () => {
    await truncateTables()
  })

  test.group('Login Tests', (loginGroup) => {
    loginGroup.each.setup(async () => {
      // Any specific setup for login tests
    })

    test('Successful login with valid credentials', async () => {
      const plainPassword = 'password123'
      const user = await createUser({
        email: 'loginuser@example.com',
        password: plainPassword, // createUser helper should hash this
        fullName: 'Login User',
      })

      const response = await apiClient.post('/').form({
        email: user.email,
        password: plainPassword,
      })

      response.assertStatus(302)
      response.assertRedirectsToPath('/home')
      // AdonisJS auth typically doesn't set a success flash message on login,
      // but rather on actions like registration or password reset.
      // If your app does, uncomment and adjust:
      // response.assertSessionHas('flash_messages.success', 'Logged in successfully.')

      // Verify authentication by accessing an authenticated route
      const authClient = getAuthenticatedClient(user) // Use the user object from createUser
      const homeResponse = await authClient.get('/home')
      homeResponse.assertStatus(200)
      homeResponse.assertTextIncludes('Dashboard') // Or some text specific to the home page
    })

    test('Failed login with invalid email', async () => {
      const response = await apiClient.post('/').form({
        email: 'nonexistent@example.com',
        password: 'anypassword',
      })

      response.assertStatus(302)
      response.assertRedirectsToPath('/') // Redirects back to login
      response.assertSessionHas('flash.error', 'Invalid credentials') // Or specific error key

      // Verify not authenticated (optional: try accessing an auth route)
      const homeResponse = await apiClient.get('/home')
      homeResponse.assertStatus(302) // Should redirect to login
      homeResponse.assertRedirectsToPath('/')
    })

    test('Failed login with incorrect password', async () => {
      const plainPassword = 'password123'
      const user = await createUser({
        email: 'wrongpass@example.com',
        password: plainPassword,
      })

      const response = await apiClient.post('/').form({
        email: user.email,
        password: 'incorrectpassword',
      })

      response.assertStatus(302)
      response.assertRedirectsToPath('/')
      response.assertSessionHas('flash.error', 'Invalid credentials')
    })

    test('Login with empty credentials', async () => {
      // AdonisJS built-in User.verifyCredentials throws an error for empty email/password
      // which is caught and results in 'Invalid credentials' flash message.
      // Specific validation errors for empty fields usually happen at the validator level
      // before hitting verifyCredentials. If a validator is added, this test needs adjustment.
      const response = await apiClient.post('/').form({
        email: '',
        password: '',
      })

      response.assertStatus(302)
      response.assertRedirectsToPath('/')
      response.assertSessionHas('flash.error', 'Invalid credentials')
      // If a validator was in place, you might assert specific validation errors:
      // response.assertSessionHasErrors(['email', 'password'])
      // response.assertBodyContains({ errors: [{ rule: 'required', field: 'email', message: 'Email is required' }] })
    })
  })

  test.group('Logout Test', (logoutGroup) => {
    test('Successful logout', async () => {
      const plainPassword = 'logoutpassword'
      const user = await createUser({
        email: 'logoutuser@example.com',
        password: plainPassword,
      })

      // Log the user in first
      await apiClient.post('/').form({ email: user.email, password: plainPassword })

      // Now get an authenticated client to perform logout
      const authClient = getAuthenticatedClient(user)
      const response = await authClient.post('/logout')

      response.assertStatus(302)
      response.assertRedirectsToPath('/')
      // Check for flash message if your app implements one for logout
      // response.assertSessionHas('flash_messages.success', 'Logged out successfully.')

      // Verify user is logged out by trying to access an authenticated route
      const homeResponse = await apiClient.get('/home') // Use the non-authenticated client
      homeResponse.assertStatus(302)
      homeResponse.assertRedirectsToPath('/')
    })
  })

  test.group('Guest Middleware Test', (guestGroup) => {
    test('Authenticated user trying to access guest-only page (login page)', async () => {
      const plainPassword = 'guesttestpassword'
      const user = await createUser({
        email: 'guestuser@example.com',
        password: plainPassword,
      })

      const authClient = getAuthenticatedClient(user) // Get an authenticated client
      const response = await authClient.get('/') // Try to access the login page (GET /)

      response.assertStatus(302)
      response.assertRedirectsToPath('/home') // Should redirect to dashboard/home
    })
  })
})

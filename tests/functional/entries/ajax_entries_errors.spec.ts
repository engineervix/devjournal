import { test } from '@japa/runner'
import EntryService from '#services/entry_service'
import User from '#models/user'
import Entry from '#models/entry'
import app from '@adonisjs/core/services/app'

test.group('AJAX Entries Controller - Errors', () => {

  test('should return 500 if create fails', async ({ client }) => {
    const user = await User.create({ email: 'error@test.com', password: 'password' })
    
    // Mock EntryService to throw error
    class MockEntryService extends EntryService {
       async createEntry() {
           throw new Error('Simulated database error')
       }
    }
    
    app.container.swap(EntryService, () => new MockEntryService())
    
    const response = await client
      .post('/entries/ajax')
      .loginAs(user)
      .withCsrfToken()
      .json({
        entryType: 'daily',
        title: 'Error Entry',
        contentMarkdown: 'Content'
      })
      
    response.assertStatus(500)
    response.assertBodyContains({
        success: false,
        message: 'An error occurred while creating the entry.',
    })
    
    app.container.restore(EntryService)
  })

  test('should return 500 if update fails', async ({ client }) => {
    const user = await User.create({ email: 'error2@test.com', password: 'password' })
    const entry = await Entry.create({ userId: user.id, entryType: 'daily', title: 'To Update', contentMarkdown: 'Content' })
    
    // Mock EntryService to throw error
    class MockEntryService extends EntryService {
       async updateEntry() {
           throw new Error('Simulated database error')
       }
    }
    
    app.container.swap(EntryService, () => new MockEntryService())
    
    const response = await client
      .put(`/entries/${entry.id}/ajax`)
      .loginAs(user)
      .withCsrfToken()
      .json({
        entryType: 'daily',
        title: 'Update Error',
        contentMarkdown: 'Updated Content'
      })
      
    response.assertStatus(500)
    response.assertBodyContains({
        success: false,
        message: 'An error occurred while updating the entry.',
    })
    
    app.container.restore(EntryService)
  })
})

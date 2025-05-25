import { test } from '@japa/runner'
import { assert } from '@japa/assert'
import { ApiClient } from '@japa/api-client' // Corrected: direct import
import User from '#models/user'
import Entry from '#models/entry'
import Tag from '#models/tag'
import { truncateTables, createUser, createEntry } from '#tests/helpers/database' // Assuming createEntry will be added
import { getAuthenticatedClient } from '#tests/helpers/api'
import app from '@adonisjs/core/services/app'
import { EntryType } from '#models/entry'
import { DateTime } from 'luxon'

test.group('EntriesController', (group) => {
  let client: ApiClient
  let authenticatedUser: User

  group.setup(async () => {
    // This setup runs once before all tests in this group
    client = new ApiClient(await app.handle(null)) // Create a client instance
  })

  group.each.setup(async () => {
    await truncateTables()
    authenticatedUser = await createUser({
      email: 'authuser@example.com',
      password: 'password123',
      fullName: 'Auth User',
    })
  })

  test.group('index action', (indexGroup) => {
    indexGroup.each.setup(async () => {
      // Create some base entries for index tests
      const user1 = authenticatedUser // Re-use the main authenticated user for some entries
      const user2 = await createUser({ email: 'user2@example.com', password: 'password' })

      await createEntry(user1.id, {
        entryType: EntryType.Thought,
        title: 'User1 Thought 1',
        contentMarkdown: 'U1T1',
        createdAt: DateTime.now().minus({ days: 1 }),
      })
      await createEntry(user1.id, {
        entryType: EntryType.Daily,
        title: 'User1 Daily 1',
        contentMarkdown: 'U1D1',
        createdAt: DateTime.now(),
      })
      await createEntry(user2.id, {
        entryType: EntryType.Journal,
        title: 'User2 Journal 1',
        contentMarkdown: 'U2J1',
        createdAt: DateTime.now().minus({ days: 2 }),
      })
      await createEntry(user2.id, {
        entryType: EntryType.Daily,
        title: 'User2 Daily 2',
        contentMarkdown: 'U2D2',
        createdAt: DateTime.now().minus({ days: 5 }),
      })
    })

    test('list entries (unauthenticated)', async ({ client, assert }) => {
      const response = await client.get('/entries')
      response.assertStatus(200)
      response.assertBodyContains({ meta: { total: 4 } }) // Assuming pagination and all entries are public
      assert.lengthOf(response.body().data, 4) // Or based on default page size
    })

    test('list entries (authenticated)', async ({ assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get('/entries')
      response.assertStatus(200)
      response.assertBodyContains({ meta: { total: 4 } })
      assert.lengthOf(response.body().data, 4)
    })

    test('filter by type "daily"', async ({ client, assert }) => {
      const response = await client.get('/entries?type=daily')
      response.assertStatus(200)
      response.assertBodyContains({ meta: { total: 2 } })
      assert.lengthOf(response.body().data, 2)
      response.body().data.forEach((entry: any) => {
        assert.equal(entry.entry_type, EntryType.Daily)
      })
    })

    test('filter by type "thought"', async ({ client, assert }) => {
      const response = await client.get('/entries?type=thought')
      response.assertStatus(200)
      response.assertBodyContains({ meta: { total: 1 } })
      assert.lengthOf(response.body().data, 1)
      assert.equal(response.body().data[0].entry_type, EntryType.Thought)
    })

    test('filter by period "today"', async ({ client, assert }) => {
      // Create an entry for today specifically for the main authenticated user to be sure
      await createEntry(authenticatedUser.id, {
        entryType: EntryType.Note,
        title: 'Today Note',
        createdAt: DateTime.now(),
      })

      const response = await client.get('/entries?period=today')
      response.assertStatus(200)
      // Total will be 2 from setup + 1 new = 3. One from user1 (daily), one new note.
      const entriesToday = await Entry.query().whereRaw("date(created_at) = date('now')")
      assert.equal(response.body().meta.total, entriesToday.length)
      assert.isAtLeast(entriesToday.length, 1) // Ensure the query is actually finding today's entries

      for (const entry of response.body().data) {
        assert.isTrue(DateTime.fromISO(entry.created_at).hasSame(DateTime.now(), 'day'))
      }
    })

    test('filter by period "week"', async ({ client, assert }) => {
      // All 4 initial entries are within the last week. One is 1 day ago, one today, one 2 days ago, one 5 days ago.
      // The "today" test also adds one for today. So, 5 total.
      await createEntry(authenticatedUser.id, {
        entryType: EntryType.Note,
        title: 'Today Note for week test',
        createdAt: DateTime.now(),
      })
      const startOfWeek = DateTime.now().startOf('week').toISODate()
      const endOfWeek = DateTime.now().endOf('week').toISODate()
      const entriesThisWeek = await Entry.query().whereRaw(
        'date(created_at) >= ? and date(created_at) <= ?',
        [startOfWeek, endOfWeek]
      )

      const response = await client.get('/entries?period=week')
      response.assertStatus(200)
      assert.equal(response.body().meta.total, entriesThisWeek.length)
      assert.isAtLeast(entriesThisWeek.length, 2) // From setup, user1's daily and thought are in this week.
    })

    test('sort by "oldest"', async ({ client, assert }) => {
      const response = await client.get('/entries?sort=oldest')
      response.assertStatus(200)
      const entries = response.body().data
      assert.isAtLeast(entries.length, 2)
      for (let i = 0; i < entries.length - 1; i++) {
        assert.isTrue(
          DateTime.fromISO(entries[i].created_at) <= DateTime.fromISO(entries[i + 1].created_at)
        )
      }
    })

    test('sort by "newest" (default)', async ({ client, assert }) => {
      const response = await client.get('/entries') // Default sort is newest
      response.assertStatus(200)
      const entries = response.body().data
      assert.isAtLeast(entries.length, 2)
      for (let i = 0; i < entries.length - 1; i++) {
        assert.isTrue(
          DateTime.fromISO(entries[i].created_at) >= DateTime.fromISO(entries[i + 1].created_at)
        )
      }
    })
  })

  test.group('store action', (storeGroup) => {
    storeGroup.each.setup(async () => {
      // Additional setup specific to store tests if needed
    })

    test('create an entry with valid data (authenticated)', async ({ assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const entryData = {
        entryType: EntryType.Journal,
        title: 'My New Journal Entry',
        contentMarkdown: 'This is **bold** and _italic_ text.\n\nA new paragraph.',
        tags: 'journal, new, awesome', // Comma-separated string of tag names
      }
      const response = await authClient.post('/entries').form(entryData)

      response.assertStatus(302) // Redirect to the show page
      response.assertRedirectsToPath(new RegExp(`/entries/[0-9]+`)) // Check if it redirects to an entry
      response.assertSessionHas('flash_messages.success', 'Entry created successfully.') // Or similar message

      const createdEntry = await Entry.query()
        .where('title', entryData.title)
        .preload('tags')
        .first()
      assert.isNotNull(createdEntry)
      assert.equal(createdEntry!.userId, authenticatedUser.id)
      assert.equal(createdEntry!.entryType, entryData.entryType)
      assert.equal(createdEntry!.title, entryData.title)
      assert.equal(createdEntry!.contentMarkdown, entryData.contentMarkdown)
      assert.include(
        createdEntry!.contentHtml,
        '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>\n<p>A new paragraph.</p>'
      ) // Check HTML conversion
      assert.include(
        createdEntry!.contentPlain,
        'This is bold and italic text.\n\nA new paragraph.'
      ) // Check plain text conversion

      assert.lengthOf(createdEntry!.tags, 3)
      const tagNames = createdEntry!.tags.map((t) => t.name.toLowerCase())
      assert.includeMembers(tagNames, ['journal', 'new', 'awesome'])

      // Verify tag usage counts (this is a bit more involved and depends on how usage_count is updated)
      // For this test, we'll assume a simple increment or check if they exist with expected names
      for (const tagName of ['journal', 'new', 'awesome']) {
        const tag = await Tag.findBy('slug', tagName) // Assuming slugs are lowercase names
        assert.isNotNull(tag)
        // To properly test usage_count, we'd need to know its initial state or implement increment logic in createEntry/controller
        // assert.isAbove(tag!.usageCount, 0)
      }
    })

    test('create a "daily" entry without a title (authenticated)', async ({ assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const entryData = {
        entryType: EntryType.Daily,
        contentMarkdown: 'A daily log entry.',
        tags: 'daily, log',
      }
      const response = await authClient.post('/entries').form(entryData)

      response.assertStatus(302)
      response.assertRedirectsToPath(new RegExp(`/entries/[0-9]+`))

      const expectedTitle = `Daily Log - ${DateTime.now().toFormat('yyyy-MM-dd')}`
      const createdEntry = await Entry.query()
        .where('contentMarkdown', entryData.contentMarkdown)
        .first()
      assert.isNotNull(createdEntry)
      assert.equal(createdEntry!.title, expectedTitle)
      assert.equal(createdEntry!.entryType, EntryType.Daily)
    })

    test('attempt to create an entry with invalid data (authenticated)', async ({ assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const entryData = {
        // Missing entryType, title
        contentMarkdown: 'This entry is invalid.',
      }
      const response = await authClient.post('/entries').form(entryData)

      response.assertStatus(302) // Redirects back
      response.assertRedirectsToPath('/entries/create') // Or wherever the form is
      response.assertSessionHasErrors() // Check for general errors
      // Check for specific errors if your controller/validator provides them
      response.assertSessionHas('flash_messages.error') // Or check for specific error messages
      // Example: response.assertSessionHas('errors.entryType', 'The entryType field is required.')

      const count = await Entry.query().count('* as total')
      assert.equal(count[0].$extras.total, 0) // No entry should have been created
    })

    test('attempt to create an entry (unauthenticated)', async ({ client, assert }) => {
      const entryData = {
        entryType: EntryType.Thought,
        title: 'Unauth Thoughts',
        contentMarkdown: 'This should not be created.',
      }
      const response = await client.post('/entries').form(entryData)

      response.assertStatus(302) // Or 401/403 if API only and not redirecting to login
      response.assertRedirectsToPath('/login') // Assuming a login page

      const count = await Entry.query().count('* as total')
      assert.equal(count[0].$extras.total, 0)
    })
  })

  test.group('show action', (showGroup) => {
    let existingEntry: Entry

    showGroup.each.setup(async () => {
      existingEntry = await createEntry(
        authenticatedUser.id,
        {
          entryType: EntryType.Journal,
          title: 'Show Test Entry',
          contentMarkdown: 'Content for show test.',
          contentHtml: '<p>Content for show test.</p>',
          contentPlain: 'Content for show test.',
        },
        ['showtag1', 'showtag2']
      )
    })

    test('view an existing entry (unauthenticated)', async ({ client, assert }) => {
      const response = await client.get(`/entries/${existingEntry.id}`)
      response.assertStatus(200)
      response.assertBodyContains({
        entry: {
          id: existingEntry.id,
          title: 'Show Test Entry',
          content_markdown: 'Content for show test.', // Ensure your API returns snake_case or adjust assertion
          entry_type: EntryType.Journal,
        },
      })
      // Further checks for HTML content if the page renders it directly
      // For example, if using Edge templates: response.assertTextIncludes('Content for show test.')
      // If it's an API response, check the JSON body.
      const responseBody = response.body()
      assert.exists(responseBody.entry.tags)
      assert.lengthOf(responseBody.entry.tags, 2)
      assert.isTrue(responseBody.entry.tags.some((t: any) => t.name === 'showtag1'))
    })

    test('view an existing entry (authenticated)', async ({ assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get(`/entries/${existingEntry.id}`)
      response.assertStatus(200)
      response.assertBodyContains({
        entry: {
          id: existingEntry.id,
          title: 'Show Test Entry',
        },
      })
    })

    test('view a non-existent entry', async ({ client }) => {
      const nonExistentId = existingEntry.id + 999
      const response = await client.get(`/entries/${nonExistentId}`)
      response.assertStatus(404)
    })

    test('view an entry belonging to another user', async ({ client, assert }) => {
      // Assuming entries are public or rules are relaxed for this test.
      // If entries are private by default, this test might need adjustment or expect a 403/404.
      const otherUser = await createUser({ email: 'other@example.com', password: 'password' })
      const otherUserEntry = await createEntry(otherUser.id, {
        entryType: EntryType.Thought,
        title: 'Other User Entry',
        contentMarkdown: 'Secret thoughts',
      })

      const response = await client.get(`/entries/${otherUserEntry.id}`)
      response.assertStatus(200) // Or 403/404 if privacy rules are strict
      response.assertBodyContains({ entry: { title: 'Other User Entry' } })
    })
  })

  test.group('update action', (updateGroup) => {
    let ownedEntry: Entry
    let otherUser: User

    updateGroup.each.setup(async () => {
      ownedEntry = await createEntry(
        authenticatedUser.id,
        {
          entryType: EntryType.Journal,
          title: 'Original Title',
          contentMarkdown: 'Original content.',
        },
        ['tagA', 'tagB']
      )

      otherUser = await createUser({ email: 'otheruser@example.com', password: 'password' })
    })

    test('successfully update an owned entry', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const updatedData = {
        entryType: EntryType.Thought,
        title: 'Updated Title',
        contentMarkdown: 'Updated **markdown** content.',
        tags: 'tagB, tagC', // tagA removed, tagC added
      }

      const tagA_before = await Tag.findByOrFail('name', 'tagA')
      const tagB_before = await Tag.findByOrFail('name', 'tagB')
      assert.isUndefined(await Tag.findBy('name', 'tagC'))

      const response = await authClient.put(`/entries/${ownedEntry.id}`).form(updatedData)

      response.assertStatus(302) // Redirect to show page
      response.assertRedirectsToPath(new RegExp(`/entries/${ownedEntry.id}`))
      response.assertSessionHas('flash_messages.success', 'Entry updated successfully.')

      const entryInDb = await Entry.findOrFail(ownedEntry.id)
      await entryInDb.load('tags')

      assert.equal(entryInDb.entryType, updatedData.entryType)
      assert.equal(entryInDb.title, updatedData.title)
      assert.equal(entryInDb.contentMarkdown, updatedData.contentMarkdown)
      assert.include(entryInDb.contentHtml, '<p>Updated <strong>markdown</strong> content.</p>')
      assert.include(entryInDb.contentPlain, 'Updated markdown content.')

      assert.lengthOf(entryInDb.tags, 2)
      const tagNames = entryInDb.tags.map((t) => t.name)
      assert.includeMembers(tagNames, ['tagB', 'tagC'])
      assert.notIncludeMembers(tagNames, ['tagA'])

      const tagA_after = await Tag.findBy('name', 'tagA') // Might be null if usage count reached 0 and it was deleted, or just count is 0
      const tagB_after = await Tag.findByOrFail('name', 'tagB')
      const tagC_after = await Tag.findByOrFail('name', 'tagC')

      // Assuming controller decrements/increments usage counts
      // This depends on the controller's implementation of updateTags
      if (tagA_after) {
        // TagA might be deleted if its usage count became 0 and there's a cleanup mechanism
        assert.equal(tagA_after.usageCount, tagA_before.usageCount - 1)
      } else {
        // If tagA is deleted, its usage count must have been 1
        assert.equal(tagA_before.usageCount, 1)
      }
      assert.equal(tagB_after.usageCount, tagB_before.usageCount) // Unchanged as it was present before and after
      assert.equal(tagC_after.usageCount, 1) // Newly added tag
    })

    test('attempt to update an entry with invalid data', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      // Assuming title is required for Journal type.
      // The controller should have validation for this.
      const invalidData = {
        entryType: EntryType.Journal,
        title: '', // Invalid: empty title
        contentMarkdown: 'Some content.',
        tags: 'validtag',
      }
      const response = await authClient.put(`/entries/${ownedEntry.id}`).form(invalidData)

      response.assertStatus(302) // Redirects back to edit form or show page with errors
      response.assertRedirectsToPath(new RegExp(`/entries/${ownedEntry.id}/edit`)) // Or wherever the edit form is
      response.assertSessionHasErrors()
      response.assertSessionHas('flash_messages.error') // General error message

      const entryInDb = await Entry.findOrFail(ownedEntry.id)
      assert.equal(entryInDb.title, 'Original Title') // Title should not have changed
    })

    test('attempt to update an entry owned by another user', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(otherUser) // Authenticated as otherUser
      const updatedData = {
        title: 'Malicious Update Title',
        contentMarkdown: 'Trying to change content.',
        entryType: ownedEntry.entryType, // Keep type same to avoid validation issues unrelated to auth
        tags: 'tagA',
      }
      const response = await authClient.put(`/entries/${ownedEntry.id}`).form(updatedData)

      response.assertStatus(404) // Or 403, or redirect with error. Controller uses findOrFail, so 404 for other user's entry.
      // If a policy was in place that returned 403, that would be asserted.
      // If it redirected with flash, something like:
      // response.assertStatus(302)
      // response.assertRedirectsToPath('/entries') // Or home
      // response.assertSessionHas('flash_messages.error', 'You are not authorized to perform this action.')

      const entryInDb = await Entry.findOrFail(ownedEntry.id)
      assert.equal(entryInDb.title, 'Original Title') // Title should not have changed
    })

    test('attempt to update a non-existent entry', async ({ client }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const nonExistentId = ownedEntry.id + 999
      const response = await authClient.put(`/entries/${nonExistentId}`).form({
        title: 'Update for non-existent',
        contentMarkdown: 'content',
        entryType: EntryType.Note,
        tags: 'any',
      })
      response.assertStatus(404)
    })
  })

  test.group('destroy action', (destroyGroup) => {
    let entryToDelete: Entry
    let otherUserEntry: Entry
    let tag1: Tag
    let tag2: Tag // For checking usage counts

    destroyGroup.each.setup(async () => {
      // Create tags that will be used
      tag1 = await Tag.create({ name: 'deleteTag1' })
      tag2 = await Tag.create({ name: 'deleteTag2' })

      // Entry owned by authenticatedUser
      entryToDelete = await createEntry(
        authenticatedUser.id,
        { entryType: EntryType.Thought, title: 'Entry to Delete' },
        [tag1.name, tag2.name] // Use names to simulate real usage
      )
      // Refresh tags to get initial usage counts after createEntry might have modified them
      // createEntry increments usage count, so tag1 and tag2 should have usageCount = 1
      tag1 = await Tag.findOrFail(tag1.id)
      tag2 = await Tag.findOrFail(tag2.id)

      // Entry owned by another user
      const otherUser = await createUser({
        email: 'otherfordelete@example.com',
        password: 'password',
      })
      otherUserEntry = await createEntry(
        otherUser.id,
        { entryType: EntryType.Note, title: 'Other User Note' },
        [tag1.name] // Also uses tag1
      )
      // Refresh tag1 again as its usage count would be 2 now
      tag1 = await Tag.findOrFail(tag1.id)
    })

    test('successfully delete an owned entry', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)

      assert.equal(tag1.usageCount, 2, 'Tag1 initial usage count before delete')
      assert.equal(tag2.usageCount, 1, 'Tag2 initial usage count before delete')

      const response = await authClient.delete(`/entries/${entryToDelete.id}`)

      response.assertStatus(302)
      response.assertRedirectsToPath('/entries') // Or wherever it redirects after delete
      response.assertSessionHas('flash_messages.success', 'Entry deleted successfully.')

      const deletedEntryInDb = await Entry.find(entryToDelete.id)
      assert.isNull(deletedEntryInDb)

      // Check tag usage counts
      const tag1AfterDelete = await Tag.findOrFail(tag1.id)
      const tag2AfterDelete = await Tag.findBy('name', 'deleteTag2') // Tag2 might be deleted if usage count reached 0

      assert.equal(tag1AfterDelete.usageCount, 1) // Decremented because entryToDelete used it

      // If tag2's only use was entryToDelete, it might be deleted or its usage count is 0
      // The controller's _updateTagsForDelete method seems to only decrement.
      // Let's assume for now it just decrements and doesn't auto-delete tags.
      // If it auto-deletes tags when count is 0, then tag2AfterDelete would be null.
      assert.isNotNull(tag2AfterDelete)
      assert.equal(tag2AfterDelete!.usageCount, 0)
    })

    test('attempt to delete an entry owned by another user', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser) // Authenticated as main user

      const response = await authClient.delete(`/entries/${otherUserEntry.id}`)

      // Based on controller logic, findOrFail will throw, leading to a 404 by default if no specific error handling for auth.
      // Or, if a policy is added later, it could be 403.
      response.assertStatus(404)
      // If it redirected with flash:
      // response.assertStatus(302)
      // response.assertRedirectsToPath('/entries')
      // response.assertSessionHas('flash_messages.error', 'You are not authorized to perform this action.')

      const entryNotDeleted = await Entry.find(otherUserEntry.id)
      assert.isNotNull(entryNotDeleted)
    })

    test('attempt to delete a non-existent entry', async ({ client }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const nonExistentId = entryToDelete.id + 999
      const response = await authClient.delete(`/entries/${nonExistentId}`)
      response.assertStatus(404)
    })
  })

  test.group('search action', (searchGroup) => {
    searchGroup.each.setup(async () => {
      // Create a diverse set of entries for comprehensive search testing
      await createEntry(authenticatedUser.id, {
        entryType: EntryType.Thought,
        title: 'Unique Keyword Alpha',
        contentMarkdown: 'This entry talks about apples and bananas.',
        createdAt: DateTime.now().minus({ days: 3 }),
      })
      await createEntry(authenticatedUser.id, {
        entryType: EntryType.Journal,
        title: 'Another Alpha Entry',
        contentMarkdown: 'Content about oranges and the keyword Alpha.',
        createdAt: DateTime.now().minus({ days: 1 }),
      })
      await createEntry(authenticatedUser.id, {
        entryType: EntryType.Daily,
        title: 'Daily Log Beta',
        contentMarkdown: 'Just a regular daily log, nothing special. Beta keyword.',
        createdAt: DateTime.now(),
      })
      const otherUser = await createUser({ email: 'searchuser@example.com', password: 'password' })
      await createEntry(otherUser.id, {
        entryType: EntryType.Thought,
        title: 'Other User Alpha',
        contentMarkdown: 'This should not appear in authenticatedUser searches unless public.',
      })
    })

    test('search with a query string matching title/content', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get('/entries/search?q=Alpha')

      response.assertStatus(200)
      response.assertViewIs('pages/entries/search_results') // Or your search results view
      response.assertViewModelExists('entries')
      response.assertViewModelExists('query')
      response.assertViewModelProperty('query', 'Alpha')

      const entries = response.viewModel('entries').data // Assuming pagination structure
      assert.lengthOf(entries, 2) // Only two entries for the authenticated user contain "Alpha"
      assert.isTrue(
        entries.every((e: any) => e.title.includes('Alpha') || e.content_markdown.includes('Alpha'))
      )
      assert.isTrue(entries.every((e: any) => e.user_id === authenticatedUser.id))
    })

    test('search with a query string matching partial words (if supported by tsquery)', async ({
      client,
      assert,
    }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      // This test's success depends on how websearch_to_tsquery handles partials or if it's configured for prefix matching.
      // Standard websearch_to_tsquery might not do prefix matching by default without specific configuration.
      // For 'appl', it might match 'apples' if stemming/prefix matching is working.
      const response = await authClient.get('/entries/search?q=appl')
      response.assertStatus(200)
      const entries = response.viewModel('entries').data
      // Depending on ts_query config, this might be 0 or 1. If it's 1, 'apples' was matched.
      // For a robust test, we'd need to know the exact FTS config. Assuming it can match 'apples':
      if (entries.length > 0) {
        assert.lengthOf(entries, 1)
        assert.include(entries[0].content_markdown, 'apples')
      } else {
        console.warn(
          "FTS partial match for 'appl' did not find 'apples'. This might be expected depending on PG FTS config."
        )
        assert.lengthOf(entries, 0)
      }
    })

    test('search with multiple keywords', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      // websearch_to_tsquery usually handles multiple words with AND logic or interprets them as a phrase.
      const response = await authClient.get('/entries/search?q=Alpha oranges')
      response.assertStatus(200)
      const entries = response.viewModel('entries').data
      assert.lengthOf(entries, 1)
      assert.include(entries[0].title, 'Another Alpha Entry')
      assert.include(entries[0].content_markdown, 'oranges')
    })

    test('search with a query string not matching any entry', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get('/entries/search?q=NonExistentXYZ')

      response.assertStatus(200)
      response.assertViewModelProperty('query', 'NonExistentXYZ')
      const entries = response.viewModel('entries').data
      assert.lengthOf(entries, 0)
    })

    test('search with an empty query string', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get('/entries/search?q=')

      response.assertStatus(200)
      // The controller seems to return paginated results even for empty query,
      // but the search itself won't match anything specifically due to empty tsquery.
      // It might default to showing no results or all results if not handled carefully.
      // Based on `if (!query) { return view.render('pages/entries/search_results', { entries: [], query }) }`
      // it should return an empty array for entries if query is empty string.
      response.assertViewModelProperty('query', '')
      const entries = response.viewModel('entries').data
      assert.lengthOf(
        entries,
        0,
        'Search with empty query string should return no results as per controller logic'
      )
    })

    test('search with filters (type) in addition to query string', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      // We have one "Alpha" in Thought, one "Alpha" in Journal.
      const response = await authClient.get('/entries/search?q=Alpha&type=Journal')

      response.assertStatus(200)
      response.assertViewModelProperty('query', 'Alpha')
      response.assertViewModelProperty('filters.type', EntryType.Journal)
      const entries = response.viewModel('entries').data
      assert.lengthOf(entries, 1)
      assert.equal(entries[0].entry_type, EntryType.Journal)
      assert.include(entries[0].title, 'Another Alpha Entry')
    })

    test('search with filters (period) in addition to query string', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      // 'Unique Keyword Alpha' is 3 days old. 'Another Alpha Entry' is 1 day old.
      // Searching for 'Alpha' with period 'today' should yield 0 if none of the Alpha entries are from today.
      // Let's add one for today to test this.
      await createEntry(authenticatedUser.id, {
        entryType: EntryType.Journal,
        title: 'Today Alpha Special',
        contentMarkdown: 'Content about something Alpha today.',
        createdAt: DateTime.now(),
      })

      const response = await authClient.get('/entries/search?q=Alpha&period=today')
      response.assertStatus(200)
      response.assertViewModelProperty('query', 'Alpha')
      response.assertViewModelProperty('filters.period', 'today')
      const entries = response.viewModel('entries').data
      assert.lengthOf(entries, 1)
      assert.isTrue(DateTime.fromISO(entries[0].created_at).hasSame(DateTime.now(), 'day'))
      assert.include(entries[0].title, 'Today Alpha Special')
    })

    test('search with sort order "oldest"', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get('/entries/search?q=Alpha&sort=oldest')
      response.assertStatus(200)
      const entries = response.viewModel('entries').data
      assert.lengthOf(entries, 2) // The two original Alpha entries for the user
      assert.isTrue(
        DateTime.fromISO(entries[0].created_at) < DateTime.fromISO(entries[1].created_at)
      )
      assert.equal(entries[0].title, 'Unique Keyword Alpha') // Created 3 days ago
      assert.equal(entries[1].title, 'Another Alpha Entry') // Created 1 day ago
    })
  })

  test.group('byTag action', (byTagGroup) => {
    let tagA: Tag
    let tagB: Tag

    byTagGroup.each.setup(async () => {
      tagA = await Tag.create({ name: 'Tag Alpha For Test' }) // slug: tag-alpha-for-test
      tagB = await Tag.create({ name: 'Tag Beta For Test' }) // slug: tag-beta-for-test

      // Entries for authenticatedUser
      await createEntry(
        authenticatedUser.id,
        {
          title: 'Entry 1 with Alpha',
          entryType: EntryType.Journal,
          createdAt: DateTime.now().minus({ days: 2 }),
        },
        [tagA.name]
      )
      await createEntry(
        authenticatedUser.id,
        {
          title: 'Entry 2 with Alpha and Beta',
          entryType: EntryType.Thought,
          createdAt: DateTime.now(),
        },
        [tagA.name, tagB.name]
      )
      await createEntry(
        authenticatedUser.id,
        {
          title: 'Entry 3 with Beta',
          entryType: EntryType.Journal,
          createdAt: DateTime.now().minus({ days: 1 }),
        },
        [tagB.name]
      )

      // Entry for another user, also with Tag Alpha (to ensure scoping if any)
      const otherUser = await createUser({ email: 'taguser@example.com', password: 'password' })
      await createEntry(
        otherUser.id,
        { title: 'Other User Entry Alpha', entryType: EntryType.Note },
        [tagA.name]
      )
    })

    test('list entries for a specific tag', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get(`/entries/by-tag/${tagA.slug}`)

      response.assertStatus(200)
      response.assertViewIs('pages/entries/by_tag')
      response.assertViewModelExists('entries')
      response.assertViewModelExists('tag')
      response.assertViewModelProperty('tag.name', tagA.name)

      const entries = response.viewModel('entries').data
      assert.lengthOf(entries, 2) // Entry 1 and Entry 2 for authenticatedUser
      entries.forEach((entry: any) => {
        assert.isTrue(entry.tags.some((t: any) => t.slug === tagA.slug))
        assert.equal(entry.user_id, authenticatedUser.id) // Ensure entries belong to the authenticated user
      })
    })

    test('list entries for a non-existent tag slug', async ({ client }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get('/entries/by-tag/non-existent-tag-slug-123')
      response.assertStatus(404) // Tag.findByOrFail('slug', slug)
    })

    test('filtering and sorting for byTag results', async ({ client, assert }) => {
      // We have 'Entry 2 with Alpha and Beta' (Thought) created today for authenticatedUser
      // And 'Entry 1 with Alpha' (Journal) created 2 days ago.
      const authClient = getAuthenticatedClient(authenticatedUser)

      // Test 1: Filter by period=today, sort=oldest (which is also newest if only one)
      const responseToday = await authClient.get(
        `/entries/by-tag/${tagA.slug}?period=today&sort=oldest`
      )
      responseToday.assertStatus(200)
      responseToday.assertViewModelProperty('tag.name', tagA.name)
      const entriesToday = responseToday.viewModel('entries').data
      assert.lengthOf(entriesToday, 1)
      assert.equal(entriesToday[0].title, 'Entry 2 with Alpha and Beta')
      assert.isTrue(DateTime.fromISO(entriesToday[0].created_at).hasSame(DateTime.now(), 'day'))

      // Test 2: Sort by oldest (default is newest)
      const responseOldest = await authClient.get(`/entries/by-tag/${tagA.slug}?sort=oldest`)
      responseOldest.assertStatus(200)
      const entriesOldest = responseOldest.viewModel('entries').data
      assert.lengthOf(entriesOldest, 2)
      assert.equal(entriesOldest[0].title, 'Entry 1 with Alpha') // 2 days ago
      assert.equal(entriesOldest[1].title, 'Entry 2 with Alpha and Beta') // today
    })
  })

  test.group('export action', (exportGroup) => {
    exportGroup.each.setup(async () => {
      // Create some entries for the authenticatedUser
      await createEntry(
        authenticatedUser.id,
        {
          entryType: EntryType.Journal,
          title: 'My Journal for Export',
          contentMarkdown: 'This is the first journal entry.\n\nIt has **bold** text.',
          createdAt: DateTime.now().minus({ days: 2 }),
        },
        ['exportTag', 'journalTag']
      )

      await createEntry(
        authenticatedUser.id,
        {
          entryType: EntryType.Daily,
          title: 'Daily Log - Export Test', // Title will be auto-generated if not provided
          contentMarkdown: 'A daily log entry for export.',
          createdAt: DateTime.now().minus({ days: 1 }),
        },
        ['exportTag', 'dailyTag']
      )

      await createEntry(
        authenticatedUser.id,
        {
          entryType: EntryType.Thought,
          title: 'Random Thought Export',
          contentMarkdown: 'A thought about exporting.',
          createdAt: DateTime.now(),
        },
        ['exportTag']
      )
    })

    test('export entries as a single Markdown file (authenticated)', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get('/entries/export?format=single')

      response.assertStatus(200)
      response.assertHeader('content-type', 'text/markdown; charset=utf-8') // Or text/markdown; charset=utf-8
      response.assertHeader(
        'content-disposition',
        /attachment; filename="devjournal_export_.*\.md"/
      )

      const body = response.text()
      assert.include(body, '# My Journal for Export')
      assert.include(body, '## Daily Log - Export Test') // Assuming auto-title for daily
      assert.include(body, '## Random Thought Export')
      assert.include(body, 'This is the first journal entry.')
      assert.include(body, 'Tags: #exportTag, #journalTag')
      assert.include(body, 'Tags: #exportTag, #dailyTag')
      assert.include(body, 'Tags: #exportTag')
    })

    test('export entries as a ZIP file (authenticated)', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get('/entries/export?format=zip')

      response.assertStatus(200)
      response.assertHeader('content-type', 'application/zip')
      response.assertHeader(
        'content-disposition',
        /attachment; filename="devjournal_export_.*\.zip"/
      )
      assert.isTrue(response.body().length > 0, 'ZIP file should not be empty')
    })

    test('export with filters (type=daily, format=single)', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      // There's one daily log created in setup
      const response = await authClient.get('/entries/export?format=single&type=daily')

      response.assertStatus(200)
      response.assertHeader('content-type', 'text/markdown; charset=utf-8')
      response.assertHeader(
        'content-disposition',
        /attachment; filename="devjournal_export_.*\.md"/
      )

      const body = response.text()
      assert.include(body, '## Daily Log - Export Test')
      assert.notInclude(body, '# My Journal for Export')
      assert.notInclude(body, '## Random Thought Export')
      assert.include(body, 'Tags: #exportTag, #dailyTag')
    })

    test('export with filters (tag=journalTag, format=single)', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      // There's one entry with journalTag
      const targetTag = await Tag.findByOrFail('name', 'journalTag')
      const response = await authClient.get(`/entries/export?format=single&tag=${targetTag.slug}`)

      response.assertStatus(200)
      response.assertHeader('content-type', 'text/markdown; charset=utf-8')

      const body = response.text()
      assert.include(body, '# My Journal for Export')
      assert.notInclude(body, '## Daily Log - Export Test')
      assert.notInclude(body, '## Random Thought Export')
      assert.include(body, 'Tags: #exportTag, #journalTag')
    })

    test('attempt export when unauthenticated', async ({ client }) => {
      const response = await client.get('/entries/export?format=single')
      // This relies on the auth middleware redirecting to login
      response.assertStatus(302)
      response.assertRedirectsToPath('/login') // Or your app's login route
    })
  })

  test.group('tags cloud action', (tagsCloudGroup) => {
    tagsCloudGroup.each.setup(async () => {
      // Create tags with varying usage counts
      const tag1 = await Tag.create({ name: 'CloudTagOne' }) // usageCount = 0 initially
      const tag2 = await Tag.create({ name: 'CloudTagTwo' }) // usageCount = 0
      const tag3 = await Tag.create({ name: 'CloudTagThree' }) // usageCount = 0
      const tag4 = await Tag.create({ name: 'CloudTagUnused' }) // usageCount = 0

      // Create entries to increment usage counts
      // CloudTagOne: used 3 times
      await createEntry(authenticatedUser.id, { title: 'Entry A' }, [tag1.name])
      await createEntry(authenticatedUser.id, { title: 'Entry B' }, [tag1.name])
      await createEntry(authenticatedUser.id, { title: 'Entry C' }, [tag1.name])

      // CloudTagTwo: used 1 time
      await createEntry(authenticatedUser.id, { title: 'Entry D' }, [tag2.name])

      // CloudTagThree: used 5 times
      await createEntry(authenticatedUser.id, { title: 'Entry E' }, [tag3.name])
      await createEntry(authenticatedUser.id, { title: 'Entry F' }, [tag3.name])
      await createEntry(authenticatedUser.id, { title: 'Entry G' }, [tag3.name])
      await createEntry(authenticatedUser.id, { title: 'Entry H' }, [tag3.name])
      await createEntry(authenticatedUser.id, { title: 'Entry I' }, [tag3.name])

      // CloudTagUnused remains at 0, but will be fetched by controller if minUsage is 0
      // The controller logic seems to fetch all tags then calculate sizes.
    })

    test('view tag cloud page (authenticated)', async ({ client, assert }) => {
      const authClient = getAuthenticatedClient(authenticatedUser)
      const response = await authClient.get('/entries/tags') // Route is /tags as per routes file

      response.assertStatus(200)
      response.assertViewIs('pages/entries/tags_cloud') // Or your tag cloud view name
      response.assertViewModelExists('tagsWithSizes')

      const tagsWithSizes = response.viewModel('tagsWithSizes')
      assert.isArray(tagsWithSizes)
      assert.isTrue(tagsWithSizes.length >= 3) // CloudTagOne, CloudTagTwo, CloudTagThree should be present. CloudTagUnused might be if minUsage is 0.
      // Controller fetches top 50 by usage_count.

      const tagOne = tagsWithSizes.find((t: any) => t.name === 'CloudTagOne')
      const tagTwo = tagsWithSizes.find((t: any) => t.name === 'CloudTagTwo')
      const tagThree = tagsWithSizes.find((t: any) => t.name === 'CloudTagThree')
      const tagUnused = tagsWithSizes.find((t: any) => t.name === 'CloudTagUnused')

      assert.isDefined(tagOne, 'CloudTagOne should be present')
      assert.isDefined(tagTwo, 'CloudTagTwo should be present')
      assert.isDefined(tagThree, 'CloudTagThree should be present')
      assert.isDefined(
        tagUnused,
        'CloudTagUnused should be present, as controller fetches all and calculates size'
      )

      assert.isNumber(tagOne.size)
      assert.isNumber(tagTwo.size)
      assert.isNumber(tagThree.size)
      assert.isNumber(tagUnused.size)

      // Check relative sizes based on usage (tagThree > tagOne > tagTwo > tagUnused)
      // The controller uses minSize=1, maxSize=5.
      // Max usage is 5 (tagThree). Min usage is 0 (tagUnused).
      // size = minSize + (maxSize - minSize) * ( (count - minCount) / (maxCount - minCount)  || 0 )
      // For tagThree (count 5, maxCount 5): size = 1 + (4) * ( (5-0) / (5-0) ) = 1 + 4 * 1 = 5
      // For tagOne (count 3): size = 1 + 4 * ( (3-0) / (5-0) ) = 1 + 4 * 0.6 = 1 + 2.4 = 3.4
      // For tagTwo (count 1): size = 1 + 4 * ( (1-0) / (5-0) ) = 1 + 4 * 0.2 = 1 + 0.8 = 1.8
      // For tagUnused (count 0): size = 1 + 4 * ( (0-0) / (5-0) ) = 1 + 4 * 0 = 1
      assert.closeTo(tagThree.size, 5, 0.1)
      assert.closeTo(tagOne.size, 3.4, 0.1)
      assert.closeTo(tagTwo.size, 1.8, 0.1)
      assert.closeTo(tagUnused.size, 1.0, 0.1)
    })

    test('view tag cloud page (unauthenticated)', async ({ client }) => {
      // Assuming /entries/tags is protected by auth middleware
      const response = await client.get('/entries/tags')
      response.assertStatus(302)
      response.assertRedirectsToPath('/login')
    })
  })
})

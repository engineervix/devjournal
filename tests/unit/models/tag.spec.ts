import { test } from '@japa/runner'
import Tag from '#models/tag'
import { truncateTables } from '#tests/helpers/database'
import db from '@adonisjs/lucid/services/db'

test.group('Models / Tag', (group) => {
  group.each.setup(async () => {
    await truncateTables()
  })

  test('Tag Creation: creates a new tag with a name', async ({ assert }) => {
    const tagName = 'My First Tag'
    const tag = await Tag.create({ name: tagName })

    assert.instanceOf(tag, Tag)
    assert.equal(tag.name, tagName)
    assert.equal(tag.slug, 'my-first-tag') // Assuming auto-slugification
    assert.equal(tag.usageCount, 0) // Default usageCount

    const tagInDb = await Tag.find(tag.id)
    assert.isNotNull(tagInDb)
    assert.equal(tagInDb!.name, tagName)
  })

  test('Tag Creation: slug is generated correctly for various names', async ({ assert }) => {
    const testCases = [
      { name: 'Simple Tag', expectedSlug: 'simple-tag' },
      { name: 'Tag with Spaces', expectedSlug: 'tag-with-spaces' },
      { name: 'UPPERCASE Tag', expectedSlug: 'uppercase-tag' },
      { name: 'Tag With-Hyphens', expectedSlug: 'tag-with-hyphens' },
      { name: 'Tag_With_Underscores', expectedSlug: 'tag_with_underscores' }, // Or 'tag-with-underscores' depending on slugify logic
      { name: 'Tag with Numb3rs', expectedSlug: 'tag-with-numb3rs' },
      { name: '  Leading Trailing Spaces  ', expectedSlug: 'leading-trailing-spaces' },
    ]

    for (const tc of testCases) {
      const tag = await Tag.create({ name: tc.name })
      assert.equal(tag.slug, tc.expectedSlug, `Slug for "${tc.name}"`)
    }
  })

  test('Tag Creation: usageCount defaults to 0', async ({ assert }) => {
    const tag = await Tag.create({ name: 'New Tag' })
    assert.equal(tag.usageCount, 0)
  })

  test('Slug Uniqueness: fails to create a tag with a name that results in a duplicate slug', async ({ assert }) => {
    const tagName = 'Duplicate Slug Test'
    await Tag.create({ name: tagName }) // slug will be 'duplicate-slug-test'

    try {
      // Attempt to create another tag that would generate the same slug
      await Tag.create({ name: 'duplicate slug test' })
      assert.fail('Should have failed to create tag with duplicate slug')
    } catch (error) {
      // For PostgreSQL, unique violation error code is '23505'
      assert.include(error.message, 'violates unique constraint "tags_slug_unique"')
    }
  })
  
  // Relationship tests for Tags are better handled in Entry model tests or functional tests
  // where the many-to-many relationship is actively used.
})

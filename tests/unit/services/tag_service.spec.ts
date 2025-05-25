import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import TagService from '#services/tag_service'
import Tag from '#models/tag'

test.group('TagService - Database Tests', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should get all tags ordered by usage count', async ({ assert }) => {
    // Create test tags
    await Tag.createMany([
      { name: 'Popular', slug: 'popular', usageCount: 10 },
      { name: 'Medium', slug: 'medium', usageCount: 5 },
      { name: 'Rare', slug: 'rare', usageCount: 1 },
    ])

    const service = new TagService()
    const tags = await service.getAllTags()

    assert.equal(tags.length, 3)
    assert.equal(tags[0].name, 'Popular')
    assert.equal(tags[1].name, 'Medium')
    assert.equal(tags[2].name, 'Rare')
  })

  test('should find or create existing tag', async ({ assert }) => {
    // Create existing tag
    const existingTag = await Tag.create({
      name: 'existing',
      slug: 'existing',
      usageCount: 5,
    })

    const service = new TagService()
    const foundTag = await service.findOrCreateTag('existing')

    assert.equal(foundTag.id, existingTag.id)
    assert.equal(foundTag.name, 'existing')
    assert.equal(foundTag.usageCount, 5)
  })

  test('should create new tag when not found', async ({ assert }) => {
    const service = new TagService()
    const newTag = await service.findOrCreateTag('new-tag')

    assert.isNotNull(newTag.id)
    assert.equal(newTag.name, 'new-tag')
    assert.equal(newTag.slug, 'new-tag')
    assert.equal(newTag.usageCount, 0)
  })

  test('should increment tag usage count', async ({ assert }) => {
    const tag = await Tag.create({
      name: 'test',
      slug: 'test',
      usageCount: 5,
    })

    const service = new TagService()
    await service.incrementUsageCount(tag.id)

    await tag.refresh()
    assert.equal(tag.usageCount, 6)
  })

  test('should decrement tag usage count', async ({ assert }) => {
    const tag = await Tag.create({
      name: 'test',
      slug: 'test',
      usageCount: 5,
    })

    const service = new TagService()
    await service.decrementUsageCount(tag.id)

    await tag.refresh()
    assert.equal(tag.usageCount, 4)
  })

  test('should not decrement usage count below zero', async ({ assert }) => {
    const tag = await Tag.create({
      name: 'test',
      slug: 'test',
      usageCount: 0,
    })

    const service = new TagService()
    await service.decrementUsageCount(tag.id)

    await tag.refresh()
    assert.equal(tag.usageCount, 0)
  })

  test('should get tags with calculated sizes', async ({ assert }) => {
    // Create test tags with different usage counts
    await Tag.createMany([
      { name: 'Popular', slug: 'popular', usageCount: 100 },
      { name: 'Medium', slug: 'medium', usageCount: 50 },
      { name: 'Small', slug: 'small', usageCount: 10 },
      { name: 'Tiny', slug: 'tiny', usageCount: 1 },
    ])

    const service = new TagService()
    const tagsWithSizes = await service.getTagsWithSizes()

    assert.equal(tagsWithSizes.length, 4)

    // Most popular tag should have size 5
    assert.equal(tagsWithSizes[0].size, 5)
    assert.equal(tagsWithSizes[0].name, 'Popular')

    // Medium tag should have size 3 (50/100 * 5 = 2.5, ceil = 3)
    assert.equal(tagsWithSizes[1].size, 3)
    assert.equal(tagsWithSizes[1].name, 'Medium')

    // Small tag should have size 1 (10/100 * 5 = 0.5, max(1, ceil(0.5)) = 1)
    assert.equal(tagsWithSizes[2].size, 1)
    assert.equal(tagsWithSizes[2].name, 'Small')

    // Tiny tag should have size 1 (minimum size)
    assert.equal(tagsWithSizes[3].size, 1)
    assert.equal(tagsWithSizes[3].name, 'Tiny')
  })

  test('should return empty array when no tags exist for getTagsWithSizes', async ({ assert }) => {
    const service = new TagService()
    const result = await service.getTagsWithSizes()

    assert.lengthOf(result, 0)
  })

  test('should handle single tag correctly in getTagsWithSizes', async ({ assert }) => {
    await Tag.create({
      name: 'Single',
      slug: 'single',
      usageCount: 42,
    })

    const service = new TagService()
    const result = await service.getTagsWithSizes()

    assert.lengthOf(result, 1)
    assert.equal(result[0].size, 5) // Single tag gets max size
    assert.equal(result[0].name, 'Single')
  })
})

test.group('TagService - Unit Tests', () => {
  test('should generate slug from tag name', ({ assert }) => {
    const service = new TagService()

    assert.equal(service.generateSlug('JavaScript'), 'javascript')
    assert.equal(service.generateSlug('Node.js Development'), 'node.js-development')
    assert.equal(service.generateSlug('React Components'), 'react-components')
    assert.equal(service.generateSlug('  Spaced  Out  '), '-spaced-out-')
  })

  test('should calculate tag sizes correctly with mocked data', ({ assert }) => {
    const service = new TagService()

    // Mock tags data
    const mockTags = [
      { usageCount: 100, serialize: () => ({ id: 1, name: 'popular', usageCount: 100 }) },
      { usageCount: 50, serialize: () => ({ id: 2, name: 'medium', usageCount: 50 }) },
      { usageCount: 10, serialize: () => ({ id: 3, name: 'small', usageCount: 10 }) },
      { usageCount: 1, serialize: () => ({ id: 4, name: 'tiny', usageCount: 1 }) },
    ]

    // Mock the getAllTags method
    service.getAllTags = async () => mockTags as any

    return service.getTagsWithSizes().then((result) => {
      assert.lengthOf(result, 4)

      // Most popular tag should have size 5
      assert.equal(result[0].size, 5)
      assert.equal(result[0].name, 'popular')

      // Medium tag should have size 3 (50/100 * 5 = 2.5, ceil = 3)
      assert.equal(result[1].size, 3)
      assert.equal(result[1].name, 'medium')

      // Small tag should have size 1 (10/100 * 5 = 0.5, max(1, ceil(0.5)) = 1)
      assert.equal(result[2].size, 1)
      assert.equal(result[2].name, 'small')

      // Tiny tag should have size 1 (minimum size)
      assert.equal(result[3].size, 1)
      assert.equal(result[3].name, 'tiny')
    })
  })

  test('should return empty array when no tags exist with mocked data', ({ assert }) => {
    const service = new TagService()

    // Mock empty tags
    service.getAllTags = async () => []

    return service.getTagsWithSizes().then((result) => {
      assert.lengthOf(result, 0)
    })
  })

  test('should handle single tag correctly with mocked data', ({ assert }) => {
    const service = new TagService()

    const mockTags = [
      { usageCount: 42, serialize: () => ({ id: 1, name: 'single', usageCount: 42 }) },
    ]

    service.getAllTags = async () => mockTags as any

    return service.getTagsWithSizes().then((result) => {
      assert.lengthOf(result, 1)
      assert.equal(result[0].size, 5) // Single tag gets max size
      assert.equal(result[0].name, 'single')
    })
  })
})

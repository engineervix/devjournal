import { test } from '@japa/runner'
import TagService from '#services/tag_service'

test.group('TagService', () => {
  test('should generate slug from tag name', ({ assert }) => {
    const service = new TagService()

    assert.equal(service.generateSlug('JavaScript'), 'javascript')
    assert.equal(service.generateSlug('Node.js Development'), 'node.js-development')
    assert.equal(service.generateSlug('React Components'), 'react-components')
    assert.equal(service.generateSlug('  Spaced  Out  '), '-spaced-out-')
  })

  test('should calculate tag sizes correctly', ({ assert }) => {
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

  test('should return empty array when no tags exist', ({ assert }) => {
    const service = new TagService()

    // Mock empty tags
    service.getAllTags = async () => []

    return service.getTagsWithSizes().then((result) => {
      assert.lengthOf(result, 0)
    })
  })

  test('should handle single tag correctly', ({ assert }) => {
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

import { inject } from '@adonisjs/core'
import Tag from '#models/tag'

export interface TagWithSize {
  id: number
  name: string
  slug: string
  usageCount: number
  size: number
  createdAt: string
  updatedAt: string
}

@inject()
export default class TagService {
  /**
   * Get all tags ordered by usage count
   */
  async getAllTags(): Promise<Tag[]> {
    return Tag.query().orderBy('usage_count', 'desc')
  }

  /**
   * Get tags with calculated sizes for tag cloud
   */
  async getTagsWithSizes(): Promise<TagWithSize[]> {
    const tags = await this.getAllTags()

    if (tags.length === 0) {
      return []
    }

    const maxUsage = tags[0].usageCount

    return tags.map((tag) => ({
      ...tag.serialize(),
      size: Math.max(1, Math.min(5, Math.ceil((tag.usageCount / maxUsage) * 5))),
    })) as TagWithSize[]
  }

  /**
   * Find or create a tag by name
   */
  async findOrCreateTag(name: string): Promise<Tag> {
    const slug = this.generateSlug(name)
    let tag = await Tag.findBy('slug', slug)

    if (!tag) {
      tag = await Tag.create({
        name,
        slug,
        usageCount: 0,
      })
    }

    return tag
  }

  /**
   * Generate slug from tag name
   */
  generateSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-')
  }

  /**
   * Increment tag usage count
   */
  async incrementUsageCount(tagId: number): Promise<void> {
    const tag = await Tag.findOrFail(tagId)
    tag.usageCount += 1
    await tag.save()
  }

  /**
   * Decrement tag usage count
   */
  async decrementUsageCount(tagId: number): Promise<void> {
    const tag = await Tag.findOrFail(tagId)
    tag.usageCount = Math.max(0, tag.usageCount - 1)
    await tag.save()
  }
}

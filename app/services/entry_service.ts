import { inject } from '@adonisjs/core'
import Entry from '#models/entry'
import Tag from '#models/tag'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'

export interface EntryFilters {
  type?: string
  period?: 'today' | 'week' | 'month'
  sort?: 'newest' | 'oldest'
  tag?: string
  searchQuery?: string
}

export interface PaginationOptions {
  page: number
  perPage: number
}

@inject()
export default class EntryService {
  /**
   * Get entries with filters and pagination
   */
  async getEntries(
    filters: EntryFilters = {},
    pagination: PaginationOptions = { page: 1, perPage: 10 }
  ): Promise<ModelPaginatorContract<Entry>> {
    const query = Entry.query()

    this.applyFilters(query, filters)
    this.applySorting(query, filters.sort)

    query.preload('tags')
    return query.paginate(pagination.page, pagination.perPage)
  }

  /**
   * Search entries with full-text search
   */
  async searchEntries(
    searchQuery: string,
    filters: EntryFilters = {},
    pagination: PaginationOptions = { page: 1, perPage: 10 }
  ): Promise<ModelPaginatorContract<Entry>> {
    if (!searchQuery.trim()) {
      return this.getEntries(filters, pagination)
    }

    const query = Entry.query()

    // Full-text search
    query.whereRaw(
      `to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content_plain, '')) @@ websearch_to_tsquery('english', ?)`,
      [searchQuery]
    )

    this.applyFilters(query, filters)
    this.applySorting(query, filters.sort)

    query.preload('tags')
    return query.paginate(pagination.page, pagination.perPage)
  }

  /**
   * Get entries by tag
   */
  async getEntriesByTag(
    tagSlug: string,
    filters: EntryFilters = {},
    pagination: PaginationOptions = { page: 1, perPage: 10 }
  ): Promise<{ tag: Tag; entries: ModelPaginatorContract<Entry> }> {
    const tag = await Tag.findByOrFail('slug', tagSlug)
    const query = tag.related('entries').query()

    this.applyFilters(query, filters)
    this.applySorting(query, filters.sort)

    query.preload('tags')
    const entries = await query.paginate(pagination.page, pagination.perPage)

    return { tag, entries }
  }

  /**
   * Get entries for export
   */
  async getEntriesForExport(userId: number, filters: EntryFilters = {}): Promise<Entry[]> {
    const query = Entry.query().where('user_id', userId)

    this.applyFilters(query, filters)

    if (filters.tag) {
      const tagRecord = await Tag.findBy('slug', filters.tag)
      if (tagRecord) {
        query.whereHas('tags', (tagQuery) => {
          tagQuery.where('tags.id', tagRecord.id)
        })
      }
    }

    query.orderBy('createdAt', 'desc').preload('tags')
    return query
  }

  /**
   * Create a new entry
   */
  async createEntry(
    userId: number,
    data: {
      entryType: string
      title?: string
      contentMarkdown?: string
      tags?: string[]
    }
  ): Promise<Entry> {
    const entry = new Entry()
    entry.userId = userId
    entry.entryType = data.entryType
    entry.title = data.title || (await this.generateDefaultTitle(data.entryType))
    entry.contentMarkdown = data.contentMarkdown || null

    await entry.save()

    if (data.tags && data.tags.length > 0) {
      await this.attachTags(entry, data.tags)
    }

    return entry
  }

  /**
   * Update an existing entry
   */
  async updateEntry(
    entryId: string,
    data: {
      entryType: string
      title?: string
      contentMarkdown?: string
      tags?: string[]
    }
  ): Promise<Entry> {
    const entry = await Entry.query().where('id', entryId).preload('tags').firstOrFail()

    entry.entryType = data.entryType
    entry.title = data.title || null
    entry.contentMarkdown = data.contentMarkdown || null

    await entry.save()

    if (data.tags !== undefined) {
      await this.syncTags(entry, data.tags)
    }

    return entry
  }

  /**
   * Delete an entry
   */
  async deleteEntry(entryId: string): Promise<void> {
    const entry = await Entry.query().where('id', entryId).preload('tags').firstOrFail()
    const tagsToUpdate = entry.tags

    await entry.delete()

    // Update tag usage counts
    for (const tag of tagsToUpdate) {
      tag.usageCount = Math.max(0, tag.usageCount - 1)
      await tag.save()
    }
  }

  /**
   * Apply filters to query
   */
  private applyFilters(query: any, filters: EntryFilters): void {
    if (filters.type) {
      query.where('entryType', filters.type)
    }

    if (filters.period) {
      const startDate = this.getStartDateForPeriod(filters.period)
      if (startDate) {
        query.where('createdAt', '>=', startDate.toISOString())
      }
    }
  }

  /**
   * Apply sorting to query
   */
  private applySorting(query: any, sort?: string): void {
    if (sort === 'oldest') {
      query.orderBy('createdAt', 'asc')
    } else {
      query.orderBy('createdAt', 'desc')
    }
  }

  /**
   * Get start date for period filter
   */
  private getStartDateForPeriod(period: 'today' | 'week' | 'month'): Date | null {
    const now = new Date()

    switch (period) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'week':
        const firstDayOfWeek = now.getDate() - now.getDay()
        return new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek)
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      default:
        return null
    }
  }

  /**
   * Generate default title for entry type
   */
  private async generateDefaultTitle(entryType: string): Promise<string | null> {
    const { DateTime } = await import('luxon')
    const date = DateTime.now().toISODate()

    switch (entryType) {
      case 'daily':
        return `Daily Log - ${date}`
      case 'til':
        return `TIL - ${date}`
      case 'snippet':
        return `Code Snippet - ${date}`
      default:
        return null
    }
  }

  /**
   * Attach tags to entry
   */
  private async attachTags(entry: Entry, tagNames: string[]): Promise<void> {
    const tagIdsToAttach = []

    for (const tagName of tagNames) {
      if (!tagName) continue
      const slug = tagName.toLowerCase().replace(/\s+/g, '-')
      let tag = await Tag.findBy('slug', slug)
      if (tag) {
        tag.usageCount += 1
        await tag.save()
      } else {
        tag = await Tag.create({ name: tagName, slug, usageCount: 1 })
      }
      tagIdsToAttach.push(tag.id)
    }

    if (tagIdsToAttach.length > 0) {
      await entry.related('tags').attach(tagIdsToAttach)
    }
  }

  /**
   * Sync tags with entry
   */
  private async syncTags(entry: Entry, tagNames: string[]): Promise<void> {
    const tagIdsToSync = []

    for (const tagName of tagNames) {
      if (!tagName) continue
      const slug = tagName.toLowerCase().replace(/\s+/g, '-')
      let tag = await Tag.findBy('slug', slug)
      if (!tag) {
        tag = await Tag.create({ name: tagName, slug, usageCount: 0 })
      }
      tagIdsToSync.push(tag.id)
    }

    // Get current tags before sync
    const currentTagIds = entry.tags.map((tag) => tag.id)

    // Sync tags
    await entry.related('tags').sync(tagIdsToSync)

    // Reload entry with new tags
    await entry.load('tags')
    const newTagIds = entry.tags.map((tag) => tag.id)

    // Calculate attached and detached tags
    const attached = tagIdsToSync.filter((id) => !currentTagIds.includes(id))
    const detached = currentTagIds.filter((id) => !newTagIds.includes(id))

    // Update usage counts
    for (const tagId of attached) {
      const tagInstance = await Tag.findOrFail(tagId)
      tagInstance.usageCount += 1
      await tagInstance.save()
    }

    for (const tagId of detached) {
      const tagInstance = await Tag.findOrFail(tagId)
      tagInstance.usageCount = Math.max(0, tagInstance.usageCount - 1)
      await tagInstance.save()
    }
  }
}

import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Entry from '#models/entry'
import Tag from '#models/tag'
import MarkdownIt from 'markdown-it'
import { htmlToText } from 'html-to-text'

const entryValidator = vine.compile(
  vine.object({
    entryType: vine.string().trim(),
    title: vine.string().trim().minLength(1).optional(),
    contentMarkdown: vine.string().trim().optional(),
    tags: vine.array(vine.string().trim().toLowerCase().minLength(1)).optional(),
  })
)

const md = new MarkdownIt() // Initialize Markdown-it parser

export default class EntriesController {
  /**
   * Display a list of resource
   */
  async index({ view, request }: HttpContext) {
    const { type, period, sort, page } = request.qs()
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)

    const query = Entry.query()

    if (type) {
      query.where('entryType', type)
    }

    if (period) {
      const now = new Date()
      let startDate: Date | undefined
      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (period === 'week') {
        const firstDayOfWeek = now.getDate() - now.getDay()
        startDate = new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek)
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }
      if (startDate) {
        startDate.setHours(0, 0, 0, 0)
        query.where('createdAt', '>=', startDate.toISOString())
      }
    }

    if (sort === 'oldest') {
      query.orderBy('createdAt', 'asc')
    } else {
      query.orderBy('createdAt', 'desc') // Default to newest
    }

    query.preload('tags')
    const entries = await query.paginate(currentPage, 10)

    const queryParams = new URLSearchParams(request.qs() as Record<string, string>)
    queryParams.delete('page')

    return view.render('pages/entries/index', { entries, queryParams: queryParams.toString() })
  }

  /**
   * Display form to create a new record
   */
  async create({ view, request }: HttpContext) {
    const allTags = await Tag.query().orderBy('name', 'asc')
    return view.render('pages/entries/create', { allTags, request })
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(entryValidator)

    let contentHtml: string | null = null
    let contentPlain: string | null = null

    if (payload.contentMarkdown) {
      contentHtml = md.render(payload.contentMarkdown)
      contentPlain = htmlToText(contentHtml, {
        wordwrap: false,
        selectors: [{ selector: 'img', format: 'skip' }],
      })
    }

    // Enhancement for Daily Logs: Auto-set title if not provided
    let entryTitle = payload.title || null
    if (payload.entryType === 'daily' && !entryTitle) {
      const { DateTime } = await import('luxon')
      entryTitle = `Daily Log - ${DateTime.now().toISODate()}`
    }

    try {
      const entry = new Entry()
      entry.userId = user.id
      entry.entryType = payload.entryType
      entry.title = entryTitle // Use the potentially auto-generated title
      entry.contentMarkdown = payload.contentMarkdown || null
      entry.contentHtml = contentHtml
      entry.contentPlain = contentPlain

      await entry.save() // Save the entry to establish its ID before associating tags

      if (payload.tags && payload.tags.length > 0) {
        const tagIdsToAttach = []
        for (const tagName of payload.tags) {
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

      session.flash('success', 'Entry created successfully.')
      return response.redirect().toRoute('entries.show', { id: entry.id })
    } catch (error) {
      console.error('Error creating entry:', error)
      session.flash('error', `Failed to create entry: ${error.message}`)
      // Flash input to session for repopulation
      session.flashAll()
      return response.redirect().back()
    }
  }

  /**
   * Show individual record
   */
  async show({ params, view }: HttpContext) {
    const entry = await Entry.query().where('id', params.id).preload('tags').firstOrFail()
    return view.render('pages/entries/show', { entry })
  }

  /**
   * Edit individual record
   */
  async edit({ params, view, request }: HttpContext) {
    const entry = await Entry.query().where('id', params.id).preload('tags').firstOrFail()
    const allTags = await Tag.query().orderBy('name', 'asc')
    return view.render('pages/entries/edit', { entry, allTags, request })
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response, session, auth }: HttpContext) {
    const user = await auth.getUserOrFail()
    const entry = await Entry.query().where('id', params.id).preload('tags').firstOrFail()
    if (entry.userId !== user.id) {
      session.flash('error', 'You are not authorized to update this entry.')
      return response.redirect().toRoute('entries.index')
    }

    const payload = await request.validateUsing(entryValidator)

    let contentHtml: string | null = entry.contentHtml
    let contentPlain: string | null = entry.contentPlain

    if (payload.contentMarkdown && payload.contentMarkdown !== entry.contentMarkdown) {
      contentHtml = md.render(payload.contentMarkdown)
      contentPlain = htmlToText(contentHtml, {
        wordwrap: false,
        selectors: [{ selector: 'img', format: 'skip' }],
      })
    } else if (!payload.contentMarkdown && entry.contentMarkdown) {
      contentHtml = null
      contentPlain = null
    }

    try {
      entry.entryType = payload.entryType
      entry.title = payload.title || null
      entry.contentMarkdown = payload.contentMarkdown || null
      entry.contentHtml = contentHtml
      entry.contentPlain = contentPlain

      await entry.save()

      const newTagNames = payload.tags || []
      const tagIdsToSync = []

      for (const tagName of newTagNames) {
        if (!tagName) continue
        const slug = tagName.toLowerCase().replace(/\s+/g, '-')
        let tag = await Tag.findBy('slug', slug)
        if (!tag) {
          tag = await Tag.create({ name: tagName, slug, usageCount: 0 })
        }
        tagIdsToSync.push(tag.id)
      }

      // Correctly handle the return type of sync
      const syncResult = (await entry.related('tags').sync(tagIdsToSync)) as unknown as {
        attached: number[]
        detached: number[]
        updated: number[]
      }

      for (const tagId of syncResult.attached) {
        const tagInstance = await Tag.findOrFail(tagId)
        tagInstance.usageCount += 1
        await tagInstance.save()
      }

      for (const tagId of syncResult.detached) {
        const tagInstance = await Tag.findOrFail(tagId)
        tagInstance.usageCount = Math.max(0, tagInstance.usageCount - 1)
        await tagInstance.save()
      }

      session.flash('success', 'Entry updated successfully.')
      return response.redirect().toRoute('entries.show', { id: entry.id })
    } catch (error) {
      console.error('Error updating entry:', error)
      session.flash('error', `Failed to update entry: ${error.message}`)
      session.flashAll() // Flash input to session
      return response.redirect().back()
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response, session, auth }: HttpContext) {
    const user = await auth.getUserOrFail()
    const entry = await Entry.query().where('id', params.id).preload('tags').firstOrFail()
    if (entry.userId !== user.id) {
      session.flash('error', 'You are not authorized to delete this entry.')
      return response.redirect().toRoute('entries.index')
    }

    try {
      const tagsToUpdate = entry.tags
      await entry.delete()

      for (const tag of tagsToUpdate) {
        tag.usageCount = Math.max(0, tag.usageCount - 1)
        await tag.save()
      }

      session.flash('success', 'Entry deleted successfully.')
      return response.redirect().toRoute('entries.index')
    } catch (error) {
      console.error('Error deleting entry:', error)
      session.flash('error', 'Failed to delete entry.')
      return response.redirect().back()
    }
  }

  /**
   * Search entries
   */
  async search({ view, request }: HttpContext) {
    const searchQuery = request.input('q', '').trim()
    const { type, period, sort, page } = request.qs()
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)

    if (!searchQuery) {
      return view.render('pages/entries/search', {
        entries: await Entry.query().paginate(currentPage, 10), // Provide paginated empty results
        query: '',
        queryParams: '',
      })
    }

    const entryQuery = Entry.query()

    // Use full-text search with websearch_to_tsquery
    entryQuery.whereRaw(
      `to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content_plain, '')) @@ websearch_to_tsquery('english', ?)`,
      [searchQuery]
    )

    if (type) {
      entryQuery.where('entryType', type)
    }

    if (period) {
      const now = new Date()
      let startDate: Date | undefined
      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (period === 'week') {
        const firstDayOfWeek = now.getDate() - now.getDay()
        startDate = new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek)
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }
      if (startDate) {
        startDate.setHours(0, 0, 0, 0)
        entryQuery.where('createdAt', '>=', startDate.toISOString())
      }
    }

    if (sort === 'oldest') {
      entryQuery.orderBy('createdAt', 'asc')
    } else if (sort === 'newest') {
      entryQuery.orderBy('createdAt', 'desc')
    }

    entryQuery.preload('tags')
    const entries = await entryQuery.paginate(currentPage, 10)

    const queryParams = new URLSearchParams(request.qs() as Record<string, string>)
    queryParams.set('q', searchQuery)
    queryParams.delete('page')

    return view.render('pages/entries/search', {
      entries,
      query: searchQuery,
      queryParams: queryParams.toString(),
    })
  }

  /**
   * Show entries by tag
   */
  async byTag({ params, request, view }: HttpContext) {
    const { slug } = params
    const tag = await Tag.findByOrFail('slug', slug)

    const { period, sort, page } = request.qs()
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)

    const entryQuery = tag.related('entries').query()

    if (period) {
      const now = new Date()
      let startDate: Date | undefined
      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (period === 'week') {
        const firstDayOfWeek = now.getDate() - now.getDay()
        startDate = new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek)
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }
      if (startDate) {
        startDate.setHours(0, 0, 0, 0)
        entryQuery.where('createdAt', '>=', startDate.toISOString())
      }
    }

    if (sort === 'oldest') {
      entryQuery.orderBy('createdAt', 'asc')
    } else {
      entryQuery.orderBy('createdAt', 'desc')
    }

    entryQuery.preload('tags')
    const entries = await entryQuery.paginate(currentPage, 10)

    const queryParams = new URLSearchParams(request.qs() as Record<string, string>)
    queryParams.delete('page')

    return view.render('pages/entries/by-tag', {
      // Ensure this view exists
      tag,
      entries,
      queryParams: queryParams.toString(),
    })
  }
}

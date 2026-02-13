import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import Entry from '#models/entry'
import EntryService from '#services/entry_service'
import ContentProcessorService from '#services/content_processor_service'
import ExportService from '#services/export_service'
import TagService from '#services/tag_service'

const entryValidator = vine.compile(
  vine.object({
    entryType: vine.string().trim().in(['daily', 'til', 'snippet', 'debug', 'achievement']),
    title: vine.string().trim().maxLength(255).nullable().optional(),
    contentMarkdown: vine.string().trim().maxLength(50000).nullable().optional(),
    tags: vine
      .array(vine.string().trim().toLowerCase().minLength(1).maxLength(50))
      .maxLength(10)
      .nullable()
      .optional(),
  })
)

@inject()
export default class EntriesController {
  constructor(
    private entryService: EntryService,
    private contentProcessor: ContentProcessorService,
    private exportService: ExportService,
    private tagService: TagService
  ) {}
  /**
   * Display a list of resource
   */
  async index({ view, request, auth }: HttpContext) {
    const { type, period, sort, page } = request.qs()
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)

    const filters = { type, period, sort }
    const pagination = { page: currentPage, perPage: 10 }

    const user = await auth.getUserOrFail()
    const entries = await this.entryService.getEntries(user.id, filters, pagination)

    const queryParams = new URLSearchParams(request.qs() as Record<string, string>)
    queryParams.delete('page')

    return view.render('pages/entries/index', { entries, queryParams: queryParams.toString() })
  }

  /**
   * Display form to create a new record
   */
  async create({ view, request }: HttpContext) {
    const allTags = await this.tagService.getAllTags()
    return view.render('pages/entries/create', { allTags, request })
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, auth, session }: HttpContext) {
    const user = await auth.getUserOrFail()
    const payload = await request.validateUsing(entryValidator)

    const entry = await this.entryService.createEntry(user.id, {
      entryType: payload.entryType,
      title: payload.title || undefined,
      contentMarkdown: payload.contentMarkdown || undefined,
      tags: payload.tags || undefined,
    })

    // Process content using ContentProcessorService
    this.contentProcessor.updateEntryContent(entry, payload.contentMarkdown || null)
    await entry.save()

    session.flash('success', 'Entry created successfully.')
    return response.redirect().toRoute('entries.show', { id: entry.id })
  }

  /**
   * Show individual record
   */
  async show({ params, view }: HttpContext) {
    const entry = await Entry.query().where('id', params.id).preload('tags').firstOrFail()

    // Create metadata for OpenGraph
    const title = entry.title || 'Entry'
    const description = entry.contentPlain
      ? entry.contentPlain.slice(0, 160).trim() + (entry.contentPlain.length > 160 ? '...' : '')
      : 'View this entry in DevJournal'

    return view.render('pages/entries/show', {
      entry,
      title: `${title} | DevJournal`,
      description,
    })
  }

  /**
   * Edit individual record
   */
  async edit({ params, view, request }: HttpContext) {
    const entry = await Entry.query().where('id', params.id).preload('tags').firstOrFail()
    const allTags = await this.tagService.getAllTags()
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

    const updatedEntry = await this.entryService.updateEntry(params.id, {
      entryType: payload.entryType,
      title: payload.title || undefined,
      contentMarkdown: payload.contentMarkdown || undefined,
      tags: payload.tags || undefined,
    })

    // Process content using ContentProcessorService
    this.contentProcessor.updateEntryContent(updatedEntry, payload.contentMarkdown || null)
    await updatedEntry.save()

    session.flash('success', 'Entry updated successfully.')
    return response.redirect().toRoute('entries.show', { id: updatedEntry.id })
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

    await this.entryService.deleteEntry(params.id)
    session.flash('success', 'Entry deleted successfully.')
    return response.redirect().toRoute('entries.index')
  }

  /**
   * Search entries
   */
  async search({ view, request, auth }: HttpContext) {
    const searchQuery = request.input('q', '').trim()
    const { type, period, sort, page } = request.qs()
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)

    const filters = { type, period, sort }
    const pagination = { page: currentPage, perPage: 10 }

    const user = await auth.getUserOrFail()
    const entries = await this.entryService.searchEntries(user.id, searchQuery, filters, pagination)

    const queryParams = new URLSearchParams(request.qs() as Record<string, string>)
    queryParams.set('q', searchQuery)
    queryParams.delete('page')

    return view.render('pages/entries/search', {
      entries,
      query: searchQuery,
      queryParams: queryParams.toString(),
      title: searchQuery ? `Search: ${searchQuery} | DevJournal` : 'Search Entries | DevJournal',
      description: searchQuery
        ? `Found ${entries.length} result${entries.length === 1 ? '' : 's'} for "${searchQuery}"`
        : 'Search your development journal entries',
    })
  }

  /**
   * Show entries by tag
   */
  async byTag({ params, request, view, auth }: HttpContext) {
    const { slug } = params
    const { period, sort, page } = request.qs()
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)

    const filters = { period, sort }
    const pagination = { page: currentPage, perPage: 10 }

    const user = await auth.getUserOrFail()
    const { tag, entries } = await this.entryService.getEntriesByTag(user.id, slug, filters, pagination)

    const queryParams = new URLSearchParams(request.qs() as Record<string, string>)
    queryParams.delete('page')

    return view.render('pages/entries/by-tag', {
      tag,
      entries,
      queryParams: queryParams.toString(),
      title: `#${tag.name} | DevJournal`,
      description: `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} tagged with #${tag.name}`,
    })
  }

  /**
   * Export entries as markdown files
   */
  async export({ request, response, auth }: HttpContext) {
    const user = await auth.getUserOrFail()
    const { type, period, tag, format = 'zip' } = request.qs()

    const filters = { type, period, tag }
    const entries = await this.entryService.getEntriesForExport(user.id, filters)

    // Generate timestamp for filename
    const { DateTime } = await import('luxon')
    const timestamp = DateTime.now().toFormat('yyyy-MM-dd_HHmmss')

    if (format === 'single') {
      const content = this.exportService.generateSingleMarkdownFile(entries)
      const filename = `devjournal-export-${timestamp}.md`
      response.header('Content-Type', 'text/markdown')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      return response.send(content)
    } else {
      const archive = await this.exportService.createZipArchive(entries)
      const filename = `devjournal-export-${timestamp}.zip`
      response.header('Content-Type', 'application/zip')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)

      // Use response.stream and let AdonisJS handle the streaming
      response.stream(archive, () => {
        return ['Unable to export entries. Please try again.', 500]
      })

      // Finalize the archive after setting up the stream
      await archive.finalize()
    }
  }

  /**
   * Show tag cloud view
   */
  async tags({ view }: HttpContext) {
    const tagsWithSizes = await this.tagService.getTagsWithSizes()
    return view.render('pages/tags/index', { tags: tagsWithSizes })
  }

  /**
   * Handle AJAX form submission for creating entries
   */
  async storeAjax({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()
      const payload = await request.validateUsing(entryValidator)

      const entry = await this.entryService.createEntry(user.id, {
        entryType: payload.entryType,
        title: payload.title && payload.title.trim() ? payload.title.trim() : undefined,
        contentMarkdown:
          payload.contentMarkdown && payload.contentMarkdown.trim()
            ? payload.contentMarkdown.trim()
            : undefined,
        tags: payload.tags || undefined,
      })

      // Process content using ContentProcessorService
      this.contentProcessor.updateEntryContent(entry, payload.contentMarkdown || null)
      await entry.save()

      // Load the entry with tags for the response
      await entry.load('tags')

      return response.json({
        success: true,
        message: 'Entry created successfully.',
        entry: {
          id: entry.id,
          title: entry.title,
          entryType: entry.entryType,
          contentMarkdown: entry.contentMarkdown || '',
          tags: entry.tags.map((tag) => tag.name),
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        },
      })
    } catch (error) {
      // Handle validation errors
      if (error.messages) {
        return response.status(422).json({
          success: false,
          message: 'Validation failed',
          errors: error.messages,
        })
      }

      // Handle other errors
      return response.status(500).json({
        success: false,
        message: 'An error occurred while creating the entry.',
        errors: [{ message: error.message }],
      })
    }
  }

  /**
   * Handle AJAX form submission for updating entries
   */
  async updateAjax({ params, request, response, auth }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()

      // First check if entry exists
      const entry = await Entry.query().where('id', params.id).preload('tags').first()

      if (!entry) {
        return response.status(404).json({
          success: false,
          message: 'Entry not found.',
        })
      }

      if (entry.userId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'You are not authorized to update this entry.',
        })
      }

      const payload = await request.validateUsing(entryValidator)

      const updatedEntry = await this.entryService.updateEntry(params.id, {
        entryType: payload.entryType,
        title: payload.title && payload.title.trim() ? payload.title.trim() : undefined,
        contentMarkdown:
          payload.contentMarkdown && payload.contentMarkdown.trim()
            ? payload.contentMarkdown.trim()
            : undefined,
        tags: payload.tags || undefined,
      })

      // Process content using ContentProcessorService
      this.contentProcessor.updateEntryContent(updatedEntry, payload.contentMarkdown || null)
      await updatedEntry.save()

      // Load the entry with tags for the response
      await updatedEntry.load('tags')

      return response.json({
        success: true,
        message: 'Entry updated successfully.',
        entry: {
          id: updatedEntry.id,
          title: updatedEntry.title,
          entryType: updatedEntry.entryType,
          contentMarkdown: updatedEntry.contentMarkdown || '',
          tags: updatedEntry.tags.map((tag) => tag.name),
          createdAt: updatedEntry.createdAt,
          updatedAt: updatedEntry.updatedAt,
        },
      })
    } catch (error) {
      // Handle validation errors
      if (error.messages) {
        return response.status(422).json({
          success: false,
          message: 'Validation failed',
          errors: error.messages,
        })
      }

      // Handle other errors
      return response.status(500).json({
        success: false,
        message: 'An error occurred while updating the entry.',
        errors: [{ message: error.message }],
      })
    }
  }
}

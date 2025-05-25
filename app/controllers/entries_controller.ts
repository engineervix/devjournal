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
    title: vine.string().trim().minLength(1).maxLength(255).optional(),
    contentMarkdown: vine.string().trim().maxLength(50000).optional(),
    tags: vine
      .array(vine.string().trim().toLowerCase().minLength(1).maxLength(50))
      .maxLength(10)
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
  async index({ view, request }: HttpContext) {
    const { type, period, sort, page } = request.qs()
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)

    const filters = { type, period, sort }
    const pagination = { page: currentPage, perPage: 10 }

    const entries = await this.entryService.getEntries(filters, pagination)

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
    const user = auth.getUserOrFail()
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
    return view.render('pages/entries/show', { entry })
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
  async search({ view, request }: HttpContext) {
    const searchQuery = request.input('q', '').trim()
    const { type, period, sort, page } = request.qs()
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)

    const filters = { type, period, sort }
    const pagination = { page: currentPage, perPage: 10 }

    const entries = await this.entryService.searchEntries(searchQuery, filters, pagination)

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
    const { period, sort, page } = request.qs()
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)

    const filters = { period, sort }
    const pagination = { page: currentPage, perPage: 10 }

    const { tag, entries } = await this.entryService.getEntriesByTag(slug, filters, pagination)

    const queryParams = new URLSearchParams(request.qs() as Record<string, string>)
    queryParams.delete('page')

    return view.render('pages/entries/by-tag', {
      tag,
      entries,
      queryParams: queryParams.toString(),
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

    if (format === 'single') {
      const content = this.exportService.generateSingleMarkdownFile(entries)
      response.header('Content-Type', 'text/markdown')
      response.header('Content-Disposition', 'attachment; filename="devjournal-export.md"')
      return response.send(content)
    } else {
      const archive = await this.exportService.createZipArchive(entries)
      response.header('Content-Type', 'application/zip')
      response.header('Content-Disposition', 'attachment; filename="devjournal-export.zip"')
      archive.pipe(response.response)
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
}

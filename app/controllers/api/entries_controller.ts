import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import EntryService from '#services/entry_service'
import Entry from '#models/entry'
import ContentProcessorService from '#services/content_processor_service'

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
    private contentProcessor: ContentProcessorService
  ) {}

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, auth }: HttpContext) {
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

    // Load tags for response
    await entry.load('tags')

    return response.status(201).json({
      success: true,
      message: 'Entry created successfully.',
      data: entry,
    })
  }
  
  /**
    * List entries
    */
  async index({ request, response, auth }: HttpContext) {
    const user = await auth.getUserOrFail()
    const { page, perPage, type, sort, period, tag, searchQuery } = request.qs()

    const filters = { 
      type, 
      period, 
      sort, 
      tag, 
      searchQuery 
    }

    const pagination = { 
      page: page ? Number(page) : 1, 
      perPage: perPage ? Number(perPage) : 10 
    }

    // Ensure we only get entries for the current user
    const entries = await this.entryService.getEntries(user.id, filters, pagination)
    
    return response.json({
        success: true, 
        data: entries 
    })
  }

  /**
   * Update entry
   */
  async update({ params, request, response, auth }: HttpContext) {
    const user = await auth.getUserOrFail()
    const { id } = params
    
    // Check ownership
    // We fetch the entry first to verify it belongs to the authenticated user
    const entry = await Entry.find(id)
    if (!entry) {
        return response.status(404).json({ success: false, message: 'Make sure the entry exists.' })
    }
    
    if (entry.userId !== user.id) {
        return response.status(403).json({ success: false, message: 'You are not authorized to update this entry.' })
    }

    const payload = await request.validateUsing(entryValidator)

    const updatedEntry = await this.entryService.updateEntry(id, {
      entryType: payload.entryType,
      title: (payload.title !== undefined ? payload.title : entry.title) || undefined,
      contentMarkdown: (payload.contentMarkdown !== undefined ? payload.contentMarkdown : entry.contentMarkdown) || undefined,
      tags: payload.tags || undefined,
    })

    this.contentProcessor.updateEntryContent(updatedEntry, payload.contentMarkdown || null)
    await updatedEntry.save()
    await updatedEntry.load('tags')

    return response.json({
      success: true,
      message: 'Entry updated successfully.',
      data: updatedEntry,
    })
  }
}

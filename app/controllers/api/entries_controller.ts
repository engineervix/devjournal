import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import EntryService from '#services/entry_service'
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
}

import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class ReprocessEntries extends BaseCommand {
  static commandName = 'reprocess:entries'
  static description = 'Reprocess all entries to apply updated content HTML markdown rules'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Starting reprocessing of entries...')
    const { default: Entry } = await import('#models/entry')
    const { default: ContentProcessorService } = await import('#services/content_processor_service')

    const entries = await Entry.all()
    const processor = await this.app.container.make(ContentProcessorService)

    for (const entry of entries) {
      if (entry.contentMarkdown) {
        await processor.updateEntryContent(entry, entry.contentMarkdown)
        await entry.save()
        this.logger.info(`Updated entry ${entry.id}`)
      }
    }

    this.logger.info('Done processing all entries!')
  }
}

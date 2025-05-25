import { inject } from '@adonisjs/core'
import type Entry from '#models/entry'

export interface ExportOptions {
  format: 'single' | 'zip'
}

@inject()
export default class ExportService {
  /**
   * Generate single markdown file content
   */
  generateSingleMarkdownFile(entries: Entry[]): string {
    let content = '# DevJournal Export\n\n'
    content += `Generated on: ${new Date().toISOString()}\n\n`

    for (const entry of entries) {
      content += '---\n\n'
      content += `## ${entry.title || 'Untitled Entry'}\n\n`
      content += `**Type:** ${entry.entryType}\n`
      content += `**Date:** ${entry.createdAt.toFormat('yyyy-MM-dd HH:mm')}\n`
      if (entry.tags && entry.tags.length > 0) {
        content += `**Tags:** ${entry.tags.map((t) => t.name).join(', ')}\n`
      }
      content += '\n'
      content += entry.contentMarkdown || 'No content'
      content += '\n\n'
    }

    return content
  }

  /**
   * Generate individual markdown files for ZIP export
   */
  generateIndividualMarkdownFiles(entries: Entry[]): Array<{ filename: string; content: string }> {
    return entries.map((entry) => {
      const frontMatter = [
        '---',
        `id: ${entry.id}`,
        `type: ${entry.entryType}`,
        `title: ${entry.title || 'Untitled Entry'}`,
        `date: ${entry.createdAt.toISODate()}`,
        `datetime: ${entry.createdAt.toISO()}`,
        entry.tags && entry.tags.length > 0
          ? `tags: [${entry.tags.map((t) => t.name).join(', ')}]`
          : '',
        '---',
        '',
      ]
        .filter(Boolean)
        .join('\n')

      const content = frontMatter + (entry.contentMarkdown || 'No content')
      const filename = `${entry.createdAt.toFormat('yyyy-MM-dd')}-${entry.entryType}-${entry.id.slice(0, 8)}.md`

      return { filename, content }
    })
  }

  /**
   * Create ZIP archive with entries
   */
  async createZipArchive(entries: Entry[]): Promise<any> {
    const archiver = await import('archiver')
    const archive = archiver.default('zip', { zlib: { level: 9 } })

    const files = this.generateIndividualMarkdownFiles(entries)

    for (const file of files) {
      archive.append(file.content, { name: file.filename })
    }

    return archive
  }
}

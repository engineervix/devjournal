import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'entries'

  async up() {
    this.schema.raw(
      `CREATE INDEX entries_search_idx ON ${this.tableName} USING gin(to_tsvector('english', content_plain));`
    )
  }

  async down() {
    this.schema.raw(`DROP INDEX IF EXISTS entries_search_idx;`)
  }
}

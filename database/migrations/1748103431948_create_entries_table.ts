import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'entries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('entry_type', 20).notNullable() // 'daily', 'til', 'snippet', 'debug', 'achievement'
      table.string('title', 255)
      table.text('content_markdown')
      table.text('content_html')
      table.text('content_plain') // for search
      table.jsonb('metadata') // flexible field for type-specific data
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

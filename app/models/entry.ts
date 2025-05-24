import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Tag from '#models/tag'

export default class Entry extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: number

  @column()
  declare entryType: string

  @column()
  declare title: string | null

  @column()
  declare contentMarkdown: string | null

  @column()
  declare contentHtml: string | null

  @column()
  declare contentPlain: string | null

  @column({ columnName: 'metadata' })
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Tag, {
    pivotTable: 'entry_tags',
  })
  declare tags: ManyToMany<typeof Tag>
}

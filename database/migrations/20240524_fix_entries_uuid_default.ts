import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'entries'

  async up() {
    // Set default for id column to gen_random_uuid()
    await this.db.rawQuery(
      `ALTER TABLE "${this.tableName}" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`
    )
  }

  async down() {
    // Remove the default for id column
    await this.db.rawQuery(`ALTER TABLE "${this.tableName}" ALTER COLUMN "id" DROP DEFAULT`)
  }
}

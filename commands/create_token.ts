import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'

export default class CreateToken extends BaseCommand {
  static commandName = 'make:token'
  static description = 'Create a Personal Access Token for a user'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'The email of the user' })
  declare email: string

  @args.string({ description: 'The name of the token' })
  declare name: string

  async run() {
    const user = await User.findBy('email', this.email)

    if (!user) {
      this.logger.error(`User with email "${this.email}" not found`)
      return
    }

    const token = await User.accessTokens.create(user, ['*'], {
      name: this.name,
    })

    this.logger.success('Token created successfully')
    this.logger.info(`Token: ${token.value!.release()}`)
  }
}

// commands/create_user.ts
import { BaseCommand } from '@adonisjs/core/ace'
import { inject } from '@adonisjs/core'
import User from '#models/user'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class CreateUser extends BaseCommand {
  static commandName = 'create:user'
  static description = 'Create a new user account'

  // We need database access, so start the app
  static options: CommandOptions = {
    startApp: true,
  }

  @inject()
  async run() {
    const email = await this.prompt.ask('Enter email address', {
      validate: (value) => {
        if (!value) return 'Email is required'
        if (!value.includes('@')) return 'Invalid email format'
        return true
      },
    })

    const password = await this.prompt.secure('Enter password', {
      validate: (value) => {
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        return true
      },
    })

    const confirmPassword = await this.prompt.secure('Confirm password')
    if (password !== confirmPassword) {
      this.logger.error('Passwords do not match')
      return
    }

    const fullName = await this.prompt.ask('Enter full name (optional)')

    try {
      const existingUser = await User.findBy('email', email)
      if (existingUser) {
        this.logger.error('User with this email already exists')
        return
      }

      const user = await User.create({
        email,
        password,
        fullName: fullName || null,
      })

      this.logger.success(`User created successfully with ID: ${user.id}`)

      // Display the created user details
      this.logger.info('User Details:')
      this.logger.info(`Email: ${user.email}`)
      this.logger.info(`Full Name: ${user.fullName || 'Not provided'}`)
      this.logger.info(`Created At: ${user.createdAt.toFormat('yyyy-MM-dd HH:mm:ss')}`)
    } catch (error) {
      this.logger.error('Failed to create user')
      this.logger.error(error.message)
    }
  }
}

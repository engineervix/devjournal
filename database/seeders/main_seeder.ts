import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { EntryFactory } from '#database/factories/entry_factory'
import User from '#models/user'
import Tag from '#models/tag'
import Entry from '#models/entry'

export default class MainSeeder extends BaseSeeder {
  async run() {
    // Create a test user
    const user = await User.firstOrCreate(
      { email: 'user@example.com' },
      {
        email: 'user@example.com',
        password: 'password',
        fullName: 'Agustín Díaz',
      }
    )

    console.log(`✅ User created/found: ${user.email}`)

    // Create developer tags (idempotent - won't create duplicates)
    const tagData = [
      'javascript',
      'typescript',
      'react',
      'nodejs',
      'python',
      'debugging',
      'performance',
      'testing',
      'docker',
      'aws',
      'database',
      'sql',
      'api',
      'frontend',
      'backend',
      'git',
      'ci-cd',
      'security',
      'architecture',
      'refactoring',
      'learning',
      'productivity',
      'algorithms',
      'data-structures',
      'web-development',
      'mobile',
      'devops',
      'microservices',
      'graphql',
      'rest-api',
      'authentication',
      'authorization',
      'caching',
      'monitoring',
      'logging',
      'deployment',
      'code-review',
      'pair-programming',
      'agile',
      'scrum',
      'project-management',
      'career',
      'mentoring',
      'open-source',
      'conference',
      'workshop',
      'tutorial',
      'documentation',
      'best-practices',
      'clean-code',
      'design-patterns',
      'solid-principles',
    ]

    const tags = []
    for (const tagName of tagData) {
      const tag = await Tag.firstOrCreate(
        { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
        {
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, '-'),
          usageCount: 0,
        }
      )
      tags.push(tag)
    }

    console.log(`✅ Created/found ${tags.length} tags`)

    // Check if we already have entries for this user
    const existingEntriesCount = await Entry.query().where('user_id', user.id).count('* as total')
    const currentCount = Number(existingEntriesCount[0]?.$extras?.total || 0)

    if (currentCount > 0) {
      console.log(`ℹ️  User already has ${currentCount} entries. Skipping entry creation.`)
      console.log('💡 To recreate entries, delete existing ones first or reset the database.')
      return
    }

    // Create entries with different types and realistic distribution
    const entryDistribution = {
      daily: 25, // Most common - daily logs
      til: 15, // Learning entries
      snippet: 10, // Code snippets
      debug: 8, // Debug sessions
      achievement: 5, // Achievements (less frequent)
    }

    console.log('🚀 Creating entries...')

    for (const [entryType, count] of Object.entries(entryDistribution)) {
      console.log(`   Creating ${count} ${entryType} entries...`)

      const entries = await EntryFactory.apply(entryType as any)
        .merge({ userId: user.id })
        .createMany(count)

      // Attach random tags to each entry (1-4 tags per entry)
      for (const entry of entries) {
        const numTags = Math.floor(Math.random() * 4) + 1 // 1-4 tags
        const selectedTags = this.getRandomTags(tags, numTags)

        await entry.related('tags').attach(selectedTags.map((tag) => tag.id))

        // Update tag usage counts
        for (const tag of selectedTags) {
          tag.usageCount += 1
          await tag.save()
        }
      }
    }

    const totalEntries = Object.values(entryDistribution).reduce((sum, count) => sum + count, 0)
    console.log(`✅ Created ${totalEntries} entries with realistic content`)
    console.log('🎉 DevJournal seeding completed!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`   • User: ${user.email} (password: password)`)
    console.log(`   • Tags: ${tags.length} developer tags`)
    console.log(
      `   • Entries: ${totalEntries} entries across ${Object.keys(entryDistribution).length} types`
    )
    console.log('')
    console.log('🚀 You can now start the app and explore the seeded data!')
  }

  /**
   * Get random tags from the available tags
   */
  private getRandomTags(tags: Tag[], count: number): Tag[] {
    const shuffled = [...tags].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, tags.length))
  }
}

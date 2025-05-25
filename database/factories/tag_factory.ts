import factory from '@adonisjs/lucid/factories'
import Tag from '#models/tag'

export const TagFactory = factory
  .define(Tag, async ({ faker }) => {
    const developerTags = [
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

    const tagName = faker.helpers.arrayElement(developerTags)
    const slug = tagName.toLowerCase().replace(/\s+/g, '-')

    return {
      name: tagName,
      slug: slug,
      usageCount: faker.number.int({ min: 1, max: 25 }),
    }
  })
  .build()

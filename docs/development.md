# Development Guide

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents**

- [Prerequisites](#prerequisites)
- [Quick Setup](#quick-setup)
- [Project Structure](#project-structure)
  - [Key Directories](#key-directories)
  - [Import Aliases](#import-aliases)
- [Development Workflow](#development-workflow)
  - [Adding a Feature](#adding-a-feature)
  - [Adding an Entry Type](#adding-an-entry-type)
  - [Database Migrations](#database-migrations)
- [Testing](#testing)
  - [Running Tests](#running-tests)
  - [Writing Tests](#writing-tests)
  - [Coverage Requirements](#coverage-requirements)
- [Code Quality](#code-quality)
- [Debugging](#debugging)
  - [Check Logs](#check-logs)
  - [Inspect Database](#inspect-database)
  - [Common Issues](#common-issues)
- [Essential Commands](#essential-commands)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Prerequisites

**Required:**

- Node.js 22+ ([nvm](https://github.com/nvm-sh/nvm) recommended)
- npm 10+
- Docker & Docker Compose
- Git

**Optional:**

- [just](https://github.com/casey/just) - Command runner for Docker workflows

**Verify:**

```bash
node --version        # v22.x.x
npm --version         # 10.x.x
docker --version      # 24.x.x+
docker compose version # v2.x.x+
```

## Quick Setup

```bash
# 1. Clone and install
git clone <repository-url>
cd devjournal
npm install

# 2. Configure environment
cp .env.example .env
cp .env.test.example .env.test

# Generate app key
node ace generate:key
# Copy output to APP_KEY in .env

# 3. Start database
just up
# Or: docker compose -f docker/docker-compose.dev.yml up -d

# 4. Run migrations
node ace migration:run

# 5. Create test user
node ace create:user

# 6. Start dev server
npm run dev

# Visit http://localhost:3333
```

**Environment files:**

`.env` (development):

```bash
NODE_ENV=development
HOST=localhost
PORT=3333
APP_KEY=<from-generate:key>
DATABASE_URL=postgres://devjournal:password@0.0.0.0:5432/devjournal
TZ=Europe/London
```

`.env.test` (test environment uses separate database):

```bash
NODE_ENV=test
DATABASE_URL=postgres://devjournal:password@0.0.0.0:5432/devjournal_test
```

## Project Structure

### Key Directories

```
devjournal/
├── app/
│   ├── controllers/       # HTTP request handlers
│   ├── models/            # Lucid ORM models (Entry, Tag, User)
│   ├── services/          # Business logic (USE THIS!)
│   ├── middleware/        # Auth, guest, silent auth
│   └── exceptions/        # Error handlers
├── database/
│   ├── migrations/        # Database schema changes
│   ├── factories/         # Test data generators
│   └── seeders/           # Database seeders
├── resources/
│   ├── views/             # Edge.js templates
│   ├── css/               # Tailwind CSS
│   └── js/                # Alpine.js components
├── tests/
│   ├── unit/              # Services, utilities
│   └── functional/        # HTTP endpoints
├── config/                # App configuration
├── start/
│   ├── routes.ts          # Route definitions
│   ├── kernel.ts          # Middleware registration
│   └── view.ts            # View globals
└── commands/              # CLI commands
```

**Architecture:**

- Controllers handle HTTP (requests/responses)
- Services contain business logic
- Models represent database tables
- Keep controllers thin, services fat

### Import Aliases

Always use aliases, not relative paths:

```typescript
// ✅ Good
import Entry from '#models/entry'
import EntryService from '#services/entry_service'
import { middleware } from '#start/kernel'

// ❌ Bad
import Entry from '../../models/entry'
```

Available: `#controllers/*`, `#models/*`, `#services/*`, `#middleware/*`, `#validators/*`, `#database/*`, `#tests/*`, `#config/*`, `#start/*`

## Development Workflow

### Adding a Feature

1. **Create feature branch:** `git checkout -b feature/your-feature`
2. **Make changes:**
   - Business logic → `app/services/`
   - HTTP handling → `app/controllers/`
   - Data models → `app/models/`
   - UI → `resources/views/`
3. **Write tests** (see Testing section)
4. **Run checks:** `npm run lint && npm run typecheck && npm test`
5. **Commit:** `npm run commit` (interactive Commitizen prompt)

### Adding an Entry Type

Example: Adding a "meeting" entry type.

**1. Update validator** (`app/controllers/entries_controller.ts`):

```typescript
entryType: vine.string().trim().in([
  'daily', 'til', 'snippet', 'debug', 'achievement',
  'meeting', // Add here
]),
```

**2. Update type** (`app/models/entry.ts`):

```typescript
export type EntryType = 'daily' | 'til' | 'snippet' | 'debug' | 'achievement' | 'meeting'
```

**3. Create template** (`resources/views/components/entry-types/meeting.edge`):

```edge
@let(template = `# Meeting with [Person/Team]
**Date:** ${date}
**Attendees:**
## Discussion
-
## Action Items
- [ ]
`)
<div class="template-content">
  {{{ template }}}
</div>
```

**4. Update frontend** - Add to entry type selector in `resources/views/pages/entries/create.edge`

**5. Write tests:**

```typescript
test('creates meeting entry', async ({ assert }) => {
  const entry = await entryService.createEntry(user.id, {
    entryType: 'meeting',
    title: 'Sprint Planning',
  })
  assert.equal(entry.entryType, 'meeting')
})
```

**6. Update docs** - Add to `docs/architecture.md` entry types list

### Database Migrations

**Create migration:**

```bash
node ace make:migration create_something_table
# Or: node ace make:migration add_column_to_table
```

**Example migration:**

```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'entries'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('featured').defaultTo(false).notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('featured')
    })
  }
}
```

**Run migrations:**

```bash
node ace migration:run           # Run pending
node ace migration:rollback      # Rollback last batch
node ace migration:status        # Check status
```

**Best practices:**

- Always provide `down()` method for rollback
- Don't modify merged migrations—create new ones
- Add indexes for foreign keys and commonly queried columns

**Model factories** (for tests):

```typescript
// database/factories/entry_factory.ts
export const EntryFactory = factory
  .define(Entry, async ({ faker }) => ({
    entryType: faker.helpers.arrayElement(['daily', 'til', 'snippet']),
    title: faker.lorem.sentence(),
    contentMarkdown: faker.lorem.paragraphs(3),
  }))
  .build()

// Usage in tests
const entry = await EntryFactory.create()
const entries = await EntryFactory.createMany(10)
const dailyEntry = await EntryFactory.merge({ entryType: 'daily' }).create()
```

## Testing

### Running Tests

```bash
npm test                              # Run all tests
node ace test --suite=unit            # Unit tests only
node ace test --suite=functional      # Functional tests only
node ace test tests/unit/services/entry_service.spec.ts  # Specific file
node ace test --watch                 # Watch mode
npm run test:coverage                 # With coverage
npm run test:coverage:html            # HTML coverage report
```

### Writing Tests

**Unit tests** (test services in isolation):

```typescript
// tests/unit/services/entry_service.spec.ts
import { test } from '@japa/runner'
import EntryService from '#services/entry_service'

test.group('EntryService', (group) => {
  group.each.setup(async () => {
    await EntryFactory.createMany(5)
  })

  test('filters entries by type', async ({ assert }) => {
    const service = new EntryService()
    const result = await service.getEntries({ type: 'daily' }, { page: 1, perPage: 10 })
    assert.isTrue(result.all().every((e) => e.entryType === 'daily'))
  })
})
```

**Functional tests** (test HTTP endpoints):

```typescript
// tests/functional/entries/create_entry.spec.ts
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'

test.group('Entries - Create', () => {
  test('creates entry successfully', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/entries')
      .loginAs(user)
      .json({
        entryType: 'daily',
        title: 'Test Entry',
        contentMarkdown: '# Hello',
        tags: ['test'],
      })

    response.assertStatus(201)
    response.assertBodyContains({ success: true })
  })

  test('requires authentication', async ({ client }) => {
    const response = await client.post('/entries').json({})
    response.assertRedirectsTo('/')
  })
})
```

**Best practices:**

- Test behavior, not implementation
- Use factories for consistent test data
- One assertion per test when possible
- Mock external services
- Test edge cases (empty arrays, null values)

### Coverage Requirements

Minimum coverage: **80%** for all metrics (lines, functions, branches, statements).

```bash
npm run test:coverage
```

If coverage drops below 80%, CI fails.

## Code Quality

**Run all checks:**

```bash
npm run lint              # ESLint
npm run lint -- --fix     # Auto-fix issues
npm run format            # Prettier
npm run typecheck         # TypeScript
npm test                  # Tests

# Or run everything:
npm run lint && npm run typecheck && npm test
```

**Pre-commit workflow:**

```bash
npm run commit            # Interactive commit with Commitizen
```

Commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

Example:

```
feat(entries): add meeting entry type

- Added meeting to validator
- Created meeting template
- Updated tests
```

**IDE setup (VS Code):**

- Install: ESLint, Prettier, Edge Template Support, Tailwind CSS IntelliSense
- Settings for format-on-save: See [VS Code docs](https://code.visualstudio.com/docs/editor/codebasics#_save-auto-format)

## Debugging

### Check Logs

**Server logs** (terminal where `npm run dev` runs):

```typescript
console.log('User:', user)
console.log('Entries:', entries.length)
```

**Node inspector:**

```bash
node --inspect ace serve --hmr
# Open chrome://inspect in Chrome, set breakpoints
```

**VS Code debugger** - Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Dev Server",
      "runtimeExecutable": "node",
      "runtimeArgs": ["ace", "serve", "--hmr"],
      "console": "integratedTerminal"
    }
  ]
}
```

Press F5 to start debugging.

### Inspect Database

**Enable query logging** (`config/database.ts`):

```typescript
{
  debug: true // Logs all SQL queries
}
```

**Connect to database:**

```bash
docker compose -f docker/docker-compose.dev.yml exec db \
  psql -U devjournal -d devjournal

# List tables
\dt

# Describe table
\d entries

# Query
SELECT * FROM entries LIMIT 5;

# Exit
\q
```

**Check migrations:**

```bash
node ace migration:status
```

### Common Issues

**Port already in use:**

```bash
lsof -i :3333
kill -9 <PID>
# Or use different port: PORT=3334 npm run dev
```

**Database connection failed:**

```bash
just up  # Start PostgreSQL
# Or: docker compose -f docker/docker-compose.dev.yml up -d
```

**Migration failed:**

```bash
# Check database is running
docker compose -f docker/docker-compose.dev.yml ps

# Verify DATABASE_URL in .env
# Rollback and retry: node ace migration:rollback
```

**HMR not working:**

```bash
# Restart dev server: Ctrl+C, then npm run dev
```

## Essential Commands

**Development:**

```bash
npm run dev              # Dev server with HMR
npm run build            # Build for production
npm start                # Production server
```

**Database:**

```bash
node ace migration:run       # Run migrations
node ace migration:rollback  # Rollback
node ace migration:status    # Check status
node ace db:seed             # Run seeders
```

**Testing:**

```bash
npm test                     # All tests
npm run test:coverage        # With coverage
node ace test --watch        # Watch mode
```

**Code quality:**

```bash
npm run lint                 # Check
npm run format               # Format
npm run typecheck            # Types
```

**User management:**

```bash
node ace create:user                    # Create user
node ace make:token <email> <name>      # API token
```

**Docker (via just):**

```bash
just up                  # Start DB
just down                # Stop DB
just logs db             # View logs
just exec db psql        # psql shell
```

**Git:**

```bash
npm run commit           # Interactive commit
npm run release          # Bump version
```

---

**Further reading:**

- `docs/architecture.md` - System design and patterns
- `AGENTS.md` - AI agent conventions and project structure
- [AdonisJS Docs](https://docs.adonisjs.com/)
- [Lucid ORM Guide](https://docs.adonisjs.com/guides/database/introduction)
- [Edge Templates](https://edgejs.dev/)

**Need help?**

1. Check server logs
2. Check database logs: `just logs db`
3. Check browser console (F12)
4. Verify `.env` variables
5. Try restarting services
6. Review error messages carefully
7. Ask in [AdonisJS Discord](https://discord.gg/vDcEjq6)

---

**Last Updated:** 2026-02-12

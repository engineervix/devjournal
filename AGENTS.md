# DevJournal - AdonisJS Project

## Project Overview

DevJournal is a personal developer journal application built with AdonisJS 6. Node.js 22, TypeScript, PostgreSQL 16 with pgvector extension.

The application helps developers track their learning journey, code snippets, debugging sessions, and achievements through daily logs, TIL entries, and more.

## Dev Environment - Quick Overview

- **Technical Docs** are in the `docs/` directory
- **Requirements**: Docker Compose (for PostgreSQL), Node.js 22, npm
- **Database**: PostgreSQL 16 with pgvector, managed via Docker Compose
- Dev server runs at <http://localhost:3333>
- **Linting and formatting / code style**:
  - TypeScript: ESLint with `@adonisjs/eslint-config`
  - Code formatting: Prettier with `@adonisjs/prettier-config`
  - Edge templates: Standard Edge.js syntax
- **Testing**: Japa test runner with c8 for coverage (80% threshold required)

## Key Commands

Run these commands from the project root.

### Development

```bash
npm run dev              # Start dev server with HMR (hot module reload)
npm run build            # Build for production
npm start                # Start production server
npm run format           # Format all code with Prettier
npm run lint             # Run ESLint checks
npm run typecheck        # Run TypeScript type checking
```

### Testing

```bash
npm test                 # Run all tests (unit + functional)
npm run test:coverage    # Run tests with text coverage report
npm run test:coverage:html   # Generate HTML coverage report in coverage/
npm run test:coverage:lcov   # Generate LCOV coverage report for CI

# Run specific test suite
node ace test --suite=unit
node ace test --suite=functional

# Run specific test file
node ace test tests/unit/services/entry_service.spec.ts
```

**IMPORTANT**: All tests must pass and coverage must meet 80% threshold (lines, functions, branches, statements) before committing.

### Database

```bash
node ace migration:run       # Run pending migrations
node ace migration:rollback  # Rollback last batch of migrations
node ace migration:status    # Check migration status
node ace create:user         # Create a new user account
```

### Docker (via just commands)

This project uses [just](https://github.com/casey/just) for common Docker Compose workflows.

```bash
just up                  # Start PostgreSQL container
just up build            # Rebuild and start container
just down                # Stop and remove containers
just down volumes        # Stop and remove containers + volumes
just stop                # Stop containers without removing
just logs db             # View database logs
just logs db follow      # Follow database logs
just exec db psql        # Open psql shell in database container
```

Or use Docker Compose directly:

```bash
docker compose -f docker/docker-compose.dev.yml up -d
docker compose -f docker/docker-compose.dev.yml down
```

### Git Workflow

```bash
npm run commit           # Interactive commit with Commitizen
npm run release          # Create new release (bump version, tag, changelog)
```

This project uses **Conventional Commits** with Commitizen.

## Key Components

The project follows AdonisJS conventions with additional structure:

- **`app/controllers/`**: HTTP request handlers
  - `entries_controller.ts`: Main controller for journal entries
  - `api/entries_controller.ts`: API endpoints
- **`app/models/`**: Lucid ORM models
  - `entry.ts`: Journal entry model (daily, TIL, snippet, debug, achievement)
  - `tag.ts`: Tag model with usage tracking
  - `user.ts`: User authentication model
- **`app/services/`**: Business logic layer
  - `entry_service.ts`: Entry querying, filtering, pagination
  - `content_processor_service.ts`: Markdown/HTML processing
  - `export_service.ts`: Entry export functionality
  - `tag_service.ts`: Tag management
- **`app/middleware/`**: HTTP middleware
  - `silent_auth_middleware.ts`: Non-blocking authentication
  - `guest_middleware.ts`: Guest-only routes
  - `container_bindings_middleware.ts`: Dependency injection setup
- **`app/exceptions/`**: Exception handlers
- **`database/migrations/`**: Database schema migrations
- **`database/factories/`**: Model factories for testing
- **`database/seeders/`**: Database seeders
- **`resources/views/`**: Edge.js templates
- **`resources/css/`**: Tailwind CSS stylesheets
- **`resources/js/`**: Frontend JavaScript (Alpine.js components)
- **`tests/unit/`**: Unit tests (services, utilities)
- **`tests/functional/`**: Integration tests (HTTP endpoints)
- **`config/`**: Application configuration files
- **`start/`**: Application bootstrap files (routes, kernel, view setup)

## Infrastructure

- **Database**: PostgreSQL 16 with pgvector extension for vector search capabilities
- **ORM**: Lucid (AdonisJS ORM) with TypeScript support
- **Sessions**: Cookie-based sessions via `@adonisjs/session`
- **Authentication**: Session-based auth (`web` guard) + Token-based auth (`api` guard)
- **Validation**: VineJS for request validation
- **Frontend Build**: Vite with HMR support
- **Error Tracking**: Sentry integration (`@sentry/node`)

## API & CLI

DevJournal provides a REST API for creating journal entries programmatically. Full documentation in `docs/api.md`.

### CLI Tool

A Go-based command-line client is available in `./cli`. It provides terminal-based entry creation with editor support, quick mode, and configuration management. See `cli/README.md` for installation and usage.

### API Quick Start

**Create an API token:**

```bash
node ace make:token user@example.com "Token Name"
```

**Make API requests:**

```bash
curl -X POST http://localhost:3333/api/v1/entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entryType": "daily", "contentMarkdown": "Your content", "tags": ["tag1"]}'
```

### Key Points

- **Endpoint**: `POST /api/v1/entries` (create entry)
- **Controller**: `app/controllers/api/entries_controller.ts`
- **Auth**: Personal Access Tokens (separate from web session auth)
- **Validation**: Same rules as web routes (VineJS)
- **No CORS**: Server-side requests only
- **Routes**: See `start/routes.ts` under `/api/v1` prefix

## Import Aliases

This project uses TypeScript import aliases defined in `package.json`:

```typescript
import Entry from '#models/entry'
import EntryService from '#services/entry_service'
import { middleware } from '#start/kernel'
// etc.
```

Available aliases:

- `#controllers/*` → `./app/controllers/*.js`
- `#models/*` → `./app/models/*.js`
- `#services/*` → `./app/services/*.js`
- `#middleware/*` → `./app/middleware/*.js`
- `#validators/*` → `./app/validators/*.js`
- `#database/*` → `./database/*.js`
- `#tests/*` → `./tests/*.js`
- `#config/*` → `./config/*.js`
- `#start/*` → `./start/*.js`

Always use these aliases instead of relative imports for cleaner code.

## Code Style & Conventions

### Naming Conventions

- **Files**: snake_case (e.g., `entry_service.ts`, `entries_controller.ts`)
- **Classes**: PascalCase (e.g., `EntryService`, `EntriesController`)
- **Functions/Methods**: camelCase (e.g., `getEntries`, `searchEntries`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PAGE_SIZE`)
- **Interfaces/Types**: PascalCase (e.g., `EntryFilters`, `PaginationOptions`)

### TypeScript Patterns

**Dependency Injection** - Use `@inject()` decorator for services:

```typescript
import { inject } from '@adonisjs/core'

@inject()
export default class EntriesController {
  constructor(
    private entryService: EntryService,
    private contentProcessor: ContentProcessorService
  ) {}

  async index({ view }: HttpContext) {
    const entries = await this.entryService.getEntries()
    return view.render('pages/entries/index', { entries })
  }
}
```

**Validation** - Use VineJS with compiled validators:

```typescript
import vine from '@vinejs/vine'

const entryValidator = vine.compile(
  vine.object({
    entryType: vine.string().in(['daily', 'til', 'snippet', 'debug', 'achievement']),
    title: vine.string().trim().maxLength(255).nullable(),
    contentMarkdown: vine.string().maxLength(50000).nullable(),
  })
)

// In controller
const data = await request.validateUsing(entryValidator)
```

**Models** - Use Lucid ORM with decorators:

```typescript
import { DateTime } from 'luxon'
import { column, BaseModel } from '@adonisjs/lucid/orm'

export default class Entry extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
```

**Services** - Keep business logic in service classes:

```typescript
@inject()
export default class EntryService {
  async getEntries(
    filters: EntryFilters = {},
    pagination: PaginationOptions = { page: 1, perPage: 10 }
  ): Promise<ModelPaginatorContract<Entry>> {
    const query = Entry.query()
    this.applyFilters(query, filters)
    return query.paginate(pagination.page, pagination.perPage)
  }
}
```

### Edge.js Templates

Templates are in `resources/views/` using Edge.js syntax:

```edge
@layout('layouts/main')

  @section('content')
    <div class="container">
      @each(entry in entries.all())
        <article>
          <h2>
            {{ entry.title }}
          </h2>
          <p>
            {{{ entry.contentHtml }}}
          </p>
        </article>
      @end
    </div>
  @end
```

- Use `{{ }}` for escaped output
- Use `{{{ }}}` for raw HTML output
- Use `@` for directives

## Testing Guidelines

### Test Structure

- **Unit tests**: Test individual services, utilities, middleware in isolation
- **Functional tests**: Test HTTP endpoints end-to-end

### Writing Tests

Use Japa test runner with AdonisJS plugin:

```typescript
import { test } from '@japa/runner'

test.group('Entry Service', (group) => {
  test('filters entries by type', async ({ assert }) => {
    const entryService = new EntryService()
    const entries = await entryService.getEntries({ type: 'daily' })

    assert.isTrue(entries.all().every((e) => e.entryType === 'daily'))
  })
})
```

For HTTP tests:

```typescript
import { test } from '@japa/runner'

test.group('Entries Controller', () => {
  test('GET /entries returns list of entries', async ({ client }) => {
    const response = await client.get('/entries')

    response.assertStatus(200)
    response.assertBodyContains({ data: [] })
  })
})
```

### Coverage Requirements

- **Minimum coverage**: 80% for lines, functions, branches, statements
- Tests should cover happy paths and error cases
- Coverage report generated with `npm run test:coverage:html`
- Excluded from coverage: migrations, seeders, factories, config files

## Workflow & Development

### Local Development Setup

1. **Start PostgreSQL**:

   ```bash
   just up
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run migrations**:

   ```bash
   node ace migration:run
   ```

5. **Create user**:

   ```bash
   node ace create:user
   ```

6. **Start dev server**:

   ```bash
   npm run dev
   ```

7. **Visit**: <http://localhost:3333>

### Making Changes

1. **Create feature branch** from `main`
2. **Make changes** following code style guidelines
3. **Run tests**: `npm test`
4. **Check linting**: `npm run lint`
5. **Format code**: `npm run format`
6. **Type check**: `npm run typecheck`
7. **Commit**
8. **Push** and create pull request

### CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push:

- Linting (`npm run lint`)
- Type checking (`npm run typecheck`)
- Tests with coverage (`npm run test:coverage`)
- Build verification (`npm run build`)

All checks must pass before merging.

## Boundaries

### ✅ Always Do

- Use import aliases (`#models/*`, `#services/*`, etc.)
- Run tests before committing
- Use `npm run commit` for conventional commits
- Maintain 80% test coverage
- Follow AdonisJS conventions and patterns
- Use dependency injection with `@inject()`
- Validate input with VineJS
- Format code with Prettier before committing
- Use Edge.js templates for views
- Keep business logic in service classes

### ⚠️ Ask First

- Database schema changes (migrations)
- Adding new dependencies
- Modifying CI/CD workflows
- Changing ESLint or Prettier configurations
- Altering authentication/authorization logic
- Modifying Docker configuration

### 🚫 Never Do

- delete files using `rm` command. Use `gio trash` instead
- use `grep` command, as it may yield unexpected results, use `rg` instead
- use `cat` command, as it may yield unexpected results, use `bat` instead
- use `find` command, as it may yield unexpected results, use `fd` instead
- Commit `.env` files or secrets
- Modify `node_modules/` or `build/` directories
- Skip tests or lower coverage thresholds
- Use relative imports instead of aliases
- Bypass validation or authentication middleware
- Hardcode sensitive data (API keys, passwords)
- Commit with test failures
- Push directly to `main` (use PRs)

## Other Notes

- This is a **personal project** for tracking developer growth and learning
- The app supports multiple entry types: daily logs, TIL, code snippets, debug sessions, achievements
- Full-text search is powered by PostgreSQL's built-in search capabilities
- Frontend uses Alpine.js for interactivity and Tailwind CSS for styling
- Markdown editing uses EasyMDE with live preview
- Export functionality allows downloading entries as ZIP or single markdown file

## References

The `_references/` directory (should not be in version control) may contain:

- Official framework documentation and source code
- Notes and advice on various issues
- Various reference including examples from other projects

When in doubt about AdonisJS conventions, refer to official docs at <https://adonisjs.com/>

# DevJournal - AdonisJS Project

## Project Overview

DevJournal is a personal developer journal application built with AdonisJS 6. Node.js 24, TypeScript, PostgreSQL 16 with pgvector extension.

The application helps developers track their learning journey, code snippets, debugging sessions, and achievements through daily logs, TIL entries, and more.

## Reference Docs

- [docs/development.md](docs/development.md) — setup, local workflow, debugging, essential commands
- [docs/architecture.md](docs/architecture.md) — tech stack, data model, system design
- [docs/api.md](docs/api.md) — REST API, endpoints, token authentication
- [docs/deployment.md](docs/deployment.md) — production setup and configuration

## Dev Environment

- Dev server: <http://localhost:3333>
- **Database**: PostgreSQL 16 + pgvector, managed via Docker Compose
- **Linting**: ESLint (`@adonisjs/eslint-config`), stylelint, Prettier (`@adonisjs/prettier-config`)
- **Testing**: Japa test runner + c8 (80% coverage threshold required)

## Key Commands

```bash
# Development
npm run dev              # Start dev server with HMR
npm run build            # Build for production
npm run lint             # ESLint
npm run lint:all         # ESLint + stylelint
npm run format           # Prettier
npm run typecheck        # TypeScript type checking

# Testing
npm test                 # Run all tests
npm run test:coverage    # Run with coverage report
node ace test --suite=unit
node ace test --suite=functional
node ace test tests/unit/services/entry_service.spec.ts

# Database
node ace migration:run
node ace migration:rollback
node ace create:user

# Docker
just up                  # Start PostgreSQL
just down                # Stop containers
# See justfile for the full list

# Git
npm run commit           # Commitizen (conventional commits)
```

**Tests must pass and coverage must meet 80% threshold before committing.**

### Git Hooks (Lefthook)

Pre-commit: ESLint, stylelint, Prettier (auto-fix on staged files) + typecheck
Commit-msg: Commitlint (conventional commits)
Pre-push: Full test suite + coverage check

```bash
git commit --no-verify   # Skip pre-commit and commit-msg hooks
git push --no-verify     # Skip pre-push hooks
```

## Key Components

- **`app/controllers/entries_controller.ts`** — journal entry HTTP handlers
- **`app/controllers/api/entries_controller.ts`** — API endpoints
- **`app/models/entry.ts`** — Entry model (daily, TIL, snippet, debug, achievement)
- **`app/models/tag.ts`** — Tag model with usage tracking
- **`app/models/user.ts`** — User model
- **`app/services/entry_service.ts`** — entry querying, filtering, pagination (user-scoped)
- **`app/services/content_processor_service.ts`** — Markdown/HTML processing
- **`app/services/export_service.ts`** — entry export
- **`app/services/tag_service.ts`** — tag management
- **`app/middleware/`** — auth, guest, silent auth, container bindings
- **`database/migrations/`** — schema migrations
- **`database/factories/`** — model factories for testing
- **`resources/views/`** — Edge.js templates
- **`start/routes.ts`** — all application routes

## API & CLI

Full API documentation: [docs/api.md](docs/api.md).

```bash
node ace make:token user@example.com "Token Name"   # Create API token
```

A Go-based CLI client is in `./cli`. See `cli/README.md`.

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

Canonical examples live in the codebase — read these files before adding new code:

- **Dependency injection** (`@inject()` decorator): `app/controllers/entries_controller.ts`
- **VineJS validation** (compiled validators, `request.validateUsing()`): `app/controllers/entries_controller.ts`
- **Lucid models** (column decorators, `BaseModel`): `app/models/entry.ts`
- **Service pattern** (business logic, query building): `app/services/entry_service.ts`

### Edge.js Templates

Templates in `resources/views/`. Use `{{ }}` for escaped output, `{{{ }}}` for raw HTML, `@` for directives. See `resources/views/layouts/main.edge` for the base layout and `resources/views/pages/entries/index.edge` for a typical page.

## Testing Guidelines

- **Unit tests**: `tests/unit/` — test services and utilities in isolation
- **Functional tests**: `tests/functional/` — test HTTP endpoints end-to-end
- **Coverage**: 80% minimum for lines, functions, branches, and statements
- Excluded from coverage: migrations, seeders, factories, config files

See existing tests for canonical patterns. Full testing docs in [docs/development.md](docs/development.md).

## Workflow & Development

See [docs/development.md](docs/development.md) for full setup, local workflow, and debugging. GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, tests with coverage, and build on every push — all must pass before merging.

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

- delete files using `rm` command. Use `trash` instead
  <!-- these are commented out as they don't apply on this system -->
  <!-- - use `grep` command, as it may yield unexpected results, use `rg` instead -->
  <!-- - use `cat` command, as it may yield unexpected results, use `bat` instead -->
  <!-- - use `find` command, as it may yield unexpected results, use `fd` instead -->
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

## As a pragmatic programmer ...

- When writing code, it's important to keep in mind these core principles:
  - **DRY (Don't Repeat Yourself)**: Every piece of knowledge should have a single, unambiguous, authoritative representation in the system. Duplication leads to inconsistency and maintenance nightmares.
  - **ETC (Easier to Change)**: This is the underlying value behind most design principles. Good design is design that's easy to change. When making decisions, ask yourself: "Did the thing I just did make the system easier or harder to change?"
  - **Orthogonality**: Keep components independent and loosely coupled. Changes in one area shouldn't ripple through unrelated parts of the system. Two components are orthogonal if changing one doesn't affect the other.

## References

The `_references/` directory (should not be in version control) may contain:

- Official framework documentation and source code
- Notes and advice on various issues
- Various reference including examples from other projects

When in doubt about AdonisJS conventions, refer to official docs in `_references/docs/adonisjs_docs`.

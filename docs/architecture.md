# Architecture Overview

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents**

- [System Design](#system-design)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Core Concepts](#core-concepts)
  - [Entry System](#entry-system)
  - [Content Processing](#content-processing)
  - [Tag System](#tag-system)
  - [Search Implementation](#search-implementation)
- [Data Model](#data-model)
- [Authentication](#authentication)
- [Services Layer](#services-layer)
- [Frontend Architecture](#frontend-architecture)
- [Performance & Security](#performance--security)
- [Deployment](#deployment)
- [References](#references)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## System Design

DevJournal is a server-rendered web application that helps developers track their learning journey, code snippets, debugging sessions, and achievements. Built with AdonisJS 6, it follows an MVC pattern enhanced with a services layer for business logic.

**Core Philosophy:** Simple, maintainable, self-hostable. Server-side rendering for reliability, progressive enhancement for interactivity.

## Technology Stack

**Backend:** AdonisJS 6 (TypeScript)

- Full-stack type safety
- Batteries included (auth, sessions, validation, ORM)
- Lucid ORM with elegant query builder
- Edge templates for server rendering
- Hot reload and excellent CLI tooling

**Database:** PostgreSQL 16 + pgvector

- Full-text search via GIN indexes
- Robust for production workloads
- JSON support for flexibility
- pgvector enables future semantic search

**Frontend:** Edge.js + Tailwind CSS + Alpine.js

- Server-side rendering (SSR) for fast page loads
- Tailwind for utility-first CSS
- Alpine.js (15kb) for progressive enhancement
- No client-side framework complexity

**Why this stack?**

- Content-heavy app benefits from SSR over SPA
- Single-process deployment (simpler than Next.js + API)
- AdonisJS provides full-stack conventions
- Perfect for personal/small team use

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Edge.js HTML │  │  Alpine.js   │  │  Tailwind    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/HTTPS
                        ▼
┌─────────────────────────────────────────────────────────┐
│              AdonisJS Application                       │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │       HTTP Layer (Controllers + Middleware)        │ │
│  └────────────────────────────────────────────────────┘ │
│                          ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │   Services Layer (EntryService, ContentProcessor)  │ │
│  └────────────────────────────────────────────────────┘ │
│                          ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │        Models (Entry, Tag, User) - Lucid ORM       │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ SQL
                        ▼
┌─────────────────────────────────────────────────────────┐
│           PostgreSQL 16 + pgvector                      │
│         (users, entries, tags, entry_tags)              │
└─────────────────────────────────────────────────────────┘
```

**Layer responsibilities:**

- **Controllers** - Handle HTTP (requests/responses)
- **Services** - Contain business logic
- **Models** - Represent database tables
- **Views** - Server-rendered templates

## Core Concepts

### Entry System

DevJournal centers around **entries** - timestamped records of developer activities.

**Entry Types:**

| Type            | Purpose                         |
| --------------- | ------------------------------- |
| **daily**       | Daily logs and reflections      |
| **til**         | Today I Learned moments         |
| **snippet**     | Code snippets with explanations |
| **debug**       | Problem-solving sessions        |
| **achievement** | Milestones and wins             |

**Why fixed types?** Ensures consistent mental models, tailored templates, simpler schema, and clear organization. New types can be added, but these five cover most developer journaling needs.

### Content Processing

Entries flow through a three-stage pipeline:

```
User Input (Markdown)
       ↓
1. Markdown Parsing (markdown-it)
       ↓
2. HTML Sanitization (DOMPurify)
       ↓
3. Plain Text Extraction (html-to-text)
       ↓
Storage: contentMarkdown, contentHtml, contentPlain
```

**Three formats stored:**

- **Markdown** - Original, editable, portable
- **HTML** - Rendered with syntax highlighting, ready to display
- **Plain text** - For full-text search indexing

DOMPurify prevents XSS attacks while preserving safe HTML elements.

### Tag System

Many-to-many relationship via `entry_tags` junction table.

**Features:**

- Usage count tracking for popular tags
- Automatic slug generation
- Case-insensitive matching (stored lowercase)
- No hierarchy/nesting (flat structure is simpler)

### Search Implementation

PostgreSQL native full-text search:

```sql
-- tsvector column with GIN index
ALTER TABLE entries ADD COLUMN search_vector tsvector;
CREATE INDEX entries_search_idx ON entries USING GIN (search_vector);

-- Auto-updated trigger on insert/update
CREATE TRIGGER entries_search_update BEFORE INSERT OR UPDATE
  tsvector_update_trigger(search_vector, 'pg_catalog.english',
                          title, content_plain);
```

**Why PostgreSQL FTS?**

- No additional infrastructure needed
- Fast for personal use (< 10k entries)
- Ranks by relevance, supports stemming
- pgvector enables future semantic search

## Data Model

**users**

```
id, email (unique), password (Argon2), timestamps
```

**entries**

```
id (uuid), user_id (fk), entry_type (enum),
title, content_markdown, content_html, content_plain,
search_vector (tsvector), timestamps
```

**tags**

```
id, name (unique, lowercase), slug (unique),
usage_count (integer), timestamps
```

**entry_tags**

```
id, entry_id (uuid fk), tag_id (integer fk), created_at
```

**Relationships:**

- User → Entries: One-to-many
- Entry ↔ Tags: Many-to-many (via entry_tags)

## Authentication

**Two guards for different use cases:**

**Web Guard** (session-based)

- Cookie-based sessions via `@adonisjs/session`
- Built-in CSRF protection
- For browser-based access

**API Guard** (token-based)

- Personal Access Tokens (Bearer authentication)
- For programmatic access, CLI tools, integrations
- Tokens currently have `['*']` abilities (read-write)

**Middleware:**

- `auth` - Requires authentication, redirects if not logged in
- `silentAuth` - Populates `auth.user` without redirecting
- `guest` - Redirects authenticated users away from login page

## Services Layer

Business logic lives in service classes, not controllers.

**EntryService**

- Query entries with filters and pagination
- Full-text search
- Create entries with auto-generated titles
- Business rules (e.g., one daily log per day)

**ContentProcessorService**

- Parse markdown to HTML
- Sanitize HTML output
- Extract plain text for search
- Syntax highlighting for code blocks

**ExportService**

- Export entries as ZIP archive
- Export entries as single markdown file
- Generate filename conventions

**TagService**

- Create or find tags (idempotent)
- Update usage counts
- Associate tags with entries

**Why services?**

- Single responsibility per service
- Testable without HTTP layer
- Reusable for web and API endpoints
- Clean dependency injection

## Frontend Architecture

**Server-Side Rendering flow:**

1. User requests page
2. Controller fetches data from services
3. Edge template renders with data
4. Complete HTML sent to browser
5. Alpine.js hydrates interactive components

**Progressive Enhancement:**

- Works without JavaScript
- Enhanced with Alpine.js for interactivity
- Examples: markdown editor with live preview, tag autocomplete, search filters

**Interactive components:**

- Markdown editor (EasyMDE integration)
- Tag input (multi-select with autocomplete)
- Search filters (dynamic form updates)
- Entry cards (expand/collapse)

## Performance & Security

**Database Indexing:**

```sql
-- Full-text search
CREATE INDEX entries_search_idx ON entries USING GIN (search_vector);

-- Foreign keys (automatic)
CREATE INDEX entries_user_id_idx ON entries (user_id);
CREATE INDEX entry_tags_entry_id_idx ON entry_tags (entry_id);

-- Query optimization
CREATE INDEX entries_created_at_idx ON entries (created_at DESC);
CREATE INDEX entries_entry_type_idx ON entries (entry_type);
```

**Query Optimization:**

- Eager loading to avoid N+1 queries: `Entry.query().preload('tags')`
- Pagination on all list views
- Selective column fetching for lists

**Security:**

- **Passwords** - Argon2 hashing
- **Sessions** - HTTP-only cookies, CSRF protection
- **Input validation** - VineJS validators, max lengths
- **XSS prevention** - Edge.js auto-escaping, DOMPurify sanitization
- **SQL injection** - Lucid ORM parameterized queries
- **Content Security Policy** - Via `@adonisjs/shield`

**Error Handling:**

- Global exception handler in `app/exceptions/handler.ts`
- Friendly error pages (404, 500)
- Sentry integration for production
- Structured JSON logging for LGTM stack

## Deployment

**Docker Compose setup:**

- **Traefik** - Reverse proxy with automatic HTTPS
- **PostgreSQL 16** - With pgvector extension
- **Automated backups** - Daily dumps to Backblaze B2
- **LGTM Stack** - Optional monitoring (Loki, Grafana)

**Startup process:**

1. Database starts → health check passes
2. App waits for healthy database
3. Migrations run automatically via `entrypoint.sh`
4. App starts on port 3000
5. Traefik routes external traffic

**Scaling considerations:**

- **Single user** - ✅ Perfect fit (current architecture)
- **Small team (< 10)** - ✅ No changes needed
- **Medium team (10-100)** - Add Redis for sessions, read replicas
- **Large scale (100+)** - Requires architectural changes

See `docs/deployment.md` for complete deployment guide.

## References

- [AdonisJS Documentation](https://docs.adonisjs.com/)
- [Lucid ORM Guide](https://docs.adonisjs.com/guides/database/introduction)
- [Edge Template Guide](https://edgejs.dev/)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

---

**Last Updated:** 2026-02-12

**Design Principles:**

- Keep it simple (avoid over-engineering)
- Follow AdonisJS conventions
- Services prevent duplication
- Progressive enhancement
- Testability first

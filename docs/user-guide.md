# User Guide

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents** _generated with [DocToc](https://github.com/thlorenz/doctoc)_

- [What is DevJournal?](#what-is-devjournal)
- [Entry Types](#entry-types)
- [Creating Entries](#creating-entries)
  - [Quick Start](#quick-start)
  - [Writing Content](#writing-content)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips & Best Practices](#tips--best-practices)
  - [Daily Routine](#daily-routine)
  - [Writing Effective Entries](#writing-effective-entries)
  - [Tag Hygiene](#tag-hygiene)
  - [Search Effectively](#search-effectively)
- [API Access](#api-access)
- [Common Questions](#common-questions)
- [Getting Help](#getting-help)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## What is DevJournal?

DevJournal helps you track your development journey through structured entries. Write daily logs, capture learnings, save code snippets, document debugging sessions, and celebrate achievements.

## Entry Types

Use the right entry type for your content:

| Type            | When to Use                         | Example                                                               |
| --------------- | ----------------------------------- | --------------------------------------------------------------------- |
| **Daily**       | End-of-day summaries, standup notes | "Today I worked on the API refactor and fixed 3 bugs"                 |
| **TIL**         | Quick learnings, "aha!" moments     | "Learned that PostgreSQL GIN indexes are faster for full-text search" |
| **Snippet**     | Reusable code patterns              | "Reusable React hook for debounced input"                             |
| **Debug**       | Problem-solving documentation       | "Tracked down memory leak in background worker"                       |
| **Achievement** | Milestones, completed features      | "Shipped v2.0 with 5 new features"                                    |

## Creating Entries

### Quick Start

1. Click **"+ New Entry"** or press `Ctrl/Cmd + N`
2. Select entry type
3. Add title (optional - auto-generated if empty)
4. Write content in markdown
5. Add tags (optional)
6. Click **Save** or press `Ctrl/Cmd + S`

### Writing Content

**Markdown basics:**

````markdown
# Heading 1

## Heading 2

**bold** and _italic_

- Bullet list

1. Numbered list

`inline code`

```javascript
// Code block with syntax highlighting
const greeting = 'Hello World'
```
````

[Link text](https://example.com)

```

**Templates are pre-filled** based on entry type. Customize or replace as needed.

### Auto-Generated Titles

Leave title empty for automatic titles:
- **Daily**: "Daily Log - 2026-02-12"
- **TIL**: "TIL - 2026-02-12"
- **Snippet**: "Code Snippet - 2026-02-12"
- **Debug**: "Debug Session - 2026-02-12"
- **Achievement**: "Achievement - 2026-02-12"

Add custom titles for searchability: "Fixed Login Bug" instead of "Debug Session - 2026-02-12"

## Organizing with Tags

### Tagging Strategy

**Use consistent, lowercase tags:**
- ✅ `javascript`, `react`, `debugging`, `api`
- ❌ `JavaScript`, `React JS`, `Debug`, `APIs`

**Create tag hierarchies with hyphens:**
- `react-hooks`, `react-testing`, `react-performance`
- `postgres-optimization`, `postgres-migrations`

**Common patterns:**
- **Languages**: `python`, `javascript`, `rust`
- **Frameworks**: `django`, `react`, `nextjs`
- **Topics**: `performance`, `security`, `testing`
- **Projects**: `project-devjournal`, `project-portfolio`

### Managing Tags

- **Popular tags** shown on homepage
- **Tag cloud** at `/tags` shows all tags by usage
- **Click any tag** to filter entries
- **Tags auto-lowercase** when you save

## Finding Entries

### Search

**Full-text search** looks in titles and content:
1. Click search bar or press `Ctrl/Cmd + /`
2. Type your query
3. Results ranked by relevance

**Search tips:**
- Searches both title and content
- Stemming enabled: "debugging" finds "debug", "debugged"
- Case-insensitive

### Filtering

**Filter by type:**
- Use dropdown to show only daily logs, TILs, etc.

**Filter by date:**
- Today, This week, This month

**Filter by tag:**
- Click tag on entry or in tag cloud

**Combine filters:**
- Search + filter by type + filter by date

### Browsing

**Homepage** shows:
- Today's entries
- Recent achievements
- Popular tags
- Your streak

**All entries** at `/entries`:
- Paginated list (10 per page)
- Newest first (default)
- Sort by newest/oldest

## Exporting Entries

### Export Options

**ZIP Archive:**
- Each entry as separate markdown file
- Organized by date and title
- Includes tags in frontmatter

**Single Markdown File:**
- All entries in one document
- Chronological order
- Table of contents included

### How to Export

1. Go to **"Export"** (in header menu)
2. Select entries to export (filter first if needed)
3. Choose format: ZIP or Markdown
4. Click **Download**

### Export Format

**Individual files** (ZIP):
```

2026-02-12-daily-log.md
2026-02-11-learned-about-indexing.md

````

**File contents:**
```markdown
---
title: Daily Log - 2026-02-12
type: daily
tags: [development, api]
date: 2026-02-12T10:30:00Z
---

# Daily Log

Today I worked on...
````

## Keyboard Shortcuts

| Shortcut       | Action                 |
| -------------- | ---------------------- |
| `Ctrl/Cmd + N` | Create new entry       |
| `Ctrl/Cmd + S` | Save entry (in editor) |
| `Ctrl/Cmd + /` | Focus search           |

## Tips & Best Practices

### Daily Routine

**Start of day:**

1. Check yesterday's entries for continuity
2. Review any TODOs from previous logs

**End of day:**

1. Create daily log entry
2. Note what you worked on
3. Add relevant tags
4. Link to related TILs or debug sessions

### Writing Effective Entries

**Be specific:**

- ❌ "Fixed bug"
- ✅ "Fixed memory leak in Redis connection pool by adding timeout"

**Include context:**

- What was the problem?
- What did you try?
- What worked?
- Why does it matter?

**Link related entries:**

- Mention entry titles in content
- Use consistent tags to connect topics

### Tag Hygiene

**Review tags monthly:**

- Consolidate similar tags (`js` → `javascript`)
- Remove unused tags
- Standardize naming

**Limit tags per entry:**

- 3-5 tags is ideal
- Too many = harder to find
- Too few = harder to categorize

### Search Effectively

**Use specific terms:**

- ❌ "bug" (too broad)
- ✅ "authentication timeout bug"

**Try variations:**

- If "optimization" doesn't work, try "optimize" or "performance"

**Filter before searching:**

- Looking for a snippet? Filter by type first
- Looking for recent work? Filter by "This week"

## API Access

Create entries programmatically via API. See `docs/api.md` for details.

**Quick example:**

```bash
# Create API token
node ace make:token your@email.com "CLI Token"

# Create entry via API
curl -X POST http://localhost:3333/api/v1/entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entryType": "til",
    "contentMarkdown": "Learned about API authentication",
    "tags": ["api", "learning"]
  }'
```

## Common Questions

**Q: Can I edit entries after saving?**
A: Yes, click any entry and click **Edit**.

**Q: Can I delete entries?**
A: Yes, click **Delete** when editing. This is permanent.

**Q: Are entries private?**
A: Yes, only you can see your entries (single-user app).

**Q: Can I attach images or files?**
A: Not yet. Use markdown image syntax with external links:

```markdown
![Screenshot](https://example.com/image.png)
```

**Q: How do I backup my data?**
A: Export all entries as ZIP or use database backups (see `docs/deployment.md`).

**Q: Can I use this on mobile?**
A: Works in mobile browser, but no native app yet. API available for custom clients.

## Getting Help

- **Architecture details**: `docs/architecture.md`
- **Development guide**: `docs/development.md`
- **Deployment guide**: `docs/deployment.md`
- **API documentation**: `docs/api.md`

---

**Remember**: DevJournal is a tool for you. Use it however helps you learn and grow. There's no wrong way to journal.

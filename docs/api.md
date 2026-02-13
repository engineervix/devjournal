<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [API Documentation](#api-documentation)
  - [Overview](#overview)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
    - [Validate Token](#validate-token)
    - [Create Entry](#create-entry)
  - [Examples](#examples)
  - [Limitations](#limitations)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# API Documentation

## Overview

REST API for creating journal entries. Uses token authentication and returns JSON responses.

**Prefer the CLI?** See [`cli/README.md`](../cli/README.md) for a terminal-based client.

## Authentication

All endpoints require a Personal Access Token in the `Authorization` header:

```bash
Authorization: Bearer YOUR_TOKEN_HERE
```

**Create a token:**

```bash
node ace make:token user@example.com "My API Token"
```

Copy the token immediately - it won't be shown again.

## Endpoints

### Validate Token

`GET /api/v1/me` - Verify token and get user info.

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

### Create Entry

`POST /api/v1/entries` - Create a journal entry.

**Request:**

```json
{
  "entryType": "daily",
  "title": "Optional custom title",
  "contentMarkdown": "Your content in markdown",
  "tags": ["tag1", "tag2"]
}
```

| Field             | Required | Description                                               |
| ----------------- | -------- | --------------------------------------------------------- |
| `entryType`       | Yes      | One of: `daily`, `til`, `snippet`, `debug`, `achievement` |
| `title`           | No       | Max 255 chars, auto-generated if omitted                  |
| `contentMarkdown` | No       | Max 50,000 chars                                          |
| `tags`            | No       | Max 10 tags, 50 chars each                                |

**Response (201):**

```json
{
  "success": true,
  "message": "Entry created successfully.",
  "data": {
    "id": "uuid",
    "entryType": "daily",
    "title": "Daily Log - 2026-02-12",
    "contentMarkdown": "Your content",
    "contentHtml": "<p>Your content</p>",
    "tags": [{ "id": 1, "name": "tag1", "slug": "tag1" }],
    "createdAt": "2026-02-12T10:00:00Z"
  }
}
```

## Examples

**cURL:**

```bash
curl -X POST https://your-domain.com/api/v1/entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entryType": "daily", "contentMarkdown": "Today I learned...", "tags": ["api"]}'
```

**JavaScript:**

```javascript
await fetch('https://your-domain.com/api/v1/entries', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    entryType: 'til',
    contentMarkdown: 'Learned how to use the API',
    tags: ['api'],
  }),
})
```

## Limitations

- **No rate limiting** (may change in future)
- **No CORS** - server-side requests only

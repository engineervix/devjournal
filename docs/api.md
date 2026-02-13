<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [API Documentation](#api-documentation)
  - [Overview](#overview)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
    - [Validate Token](#validate-token)
    - [Create Entry](#create-entry)
    - [List Entries](#list-entries)
    - [Update Entry](#update-entry)
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

### List Entries

`GET /api/v1/entries` - List journal entries with pagination and filtering.

**Query Parameters:**

| Parameter     | Description                                      | Default  |
| ------------- | ------------------------------------------------ | -------- |
| `page`        | Page number                                      | 1        |
| `perPage`     | Items per page                                   | 10       |
| `type`        | Filter by type (`daily`, `til`, `snippet`, etc.) | -        |
| `sort`        | Sort order: `newest` or `oldest`                 | `newest` |
| `period`      | Filter by time period: `today`, `week`, `month`  | -        |
| `tag`         | Filter by tag name                               | -        |
| `searchQuery` | Search term                                      | -        |

**Response:**

```json
{
  "success": true,
  "data": {
    "meta": {
      "total": 1,
      "per_page": 10,
      "current_page": 1,
      "last_page": 1,
      "first_page": 1,
      "first_page_url": "/?page=1",
      "last_page_url": "/?page=1",
      "next_page_url": null,
      "previous_page_url": null
    },
    "data": [
      {
        "id": "uuid",
        "title": "Entry Title",
        "entryType": "daily",
        "contentMarkdown": "...",
        "tags": [],
        "createdAt": "2026-02-12T10:00:00Z"
      }
    ]
  }
}
```

### Update Entry

`PUT /api/v1/entries/:id` - Update an existing entry. Only the authenticated user's entries can be updated.

**Request:**

Fields are optional; only provided fields will be updated.

```json
{
  "title": "Updated Title",
  "tags": ["new-tag"]
}
```

**Response:**

Returns the updated entry (same format as Create Entry).

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

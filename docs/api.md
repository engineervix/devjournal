# API Documentation

## Overview

DevJournal provides a REST API for programmatic access to create and manage journal entries. The API uses access token authentication and returns JSON responses.

## Authentication

All API endpoints require authentication using Personal Access Tokens (PATs).

### Creating an Access Token

Generate a token via the web interface:

1. Navigate to **Settings** → **API Tokens**
2. Click **Create New Token**
3. Give your token a descriptive name
4. Copy the token immediately (it won't be shown again)

### Using Your Token

Include the token in the `Authorization` header:

```bash
Authorization: Bearer YOUR_TOKEN_HERE
```

## Endpoints

### Create Entry

Create a new journal entry.

**Endpoint:** `POST /api/v1/entries`

**Request Body:**

```json
{
  "entryType": "daily",
  "title": "Optional custom title",
  "contentMarkdown": "Your journal entry content in markdown",
  "tags": ["tag1", "tag2"]
}
```

**Parameters:**

- `entryType` (required): One of `daily`, `til`, `snippet`, `debug`, `achievement`
- `title` (optional): Custom title (max 255 chars). Auto-generated if omitted
- `contentMarkdown` (optional): Entry content in markdown (max 50,000 chars)
- `tags` (optional): Array of tag names (max 10 tags, each max 50 chars)

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Entry created successfully.",
  "data": {
    "id": "uuid",
    "userId": 1,
    "entryType": "daily",
    "title": "Daily Log - 2026-02-12",
    "contentMarkdown": "Your content",
    "contentHtml": "<p>Your content</p>",
    "contentPlain": "Your content",
    "tags": [
      {
        "id": 1,
        "name": "tag1",
        "slug": "tag1"
      }
    ],
    "createdAt": "2026-02-12T10:00:00Z",
    "updatedAt": "2026-02-12T10:00:00Z"
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "Authentication required."
}
```

**Error Response (422 Validation Error):**

```json
{
  "errors": [
    {
      "field": "entryType",
      "message": "The entryType field must be one of: daily, til, snippet, debug, achievement"
    }
  ]
}
```

## Example Usage

### cURL

```bash
curl -X POST https://your-domain.com/api/v1/entries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "entryType": "daily",
    "contentMarkdown": "Today I learned about API authentication",
    "tags": ["api", "learning"]
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://your-domain.com/api/v1/entries', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    entryType: 'til',
    contentMarkdown: 'Learned how to use the DevJournal API',
    tags: ['api']
  })
});

const data = await response.json();
console.log(data);
```

### Python (requests)

```python
import requests

url = 'https://your-domain.com/api/v1/entries'
headers = {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
}
data = {
    'entryType': 'daily',
    'contentMarkdown': 'My journal entry',
    'tags': ['python', 'api']
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

## Rate Limiting

Currently, there are no rate limits on API requests. This may change in future versions.

## CORS

The API does not currently support CORS. API requests must be made from server-side code or tools like cURL.

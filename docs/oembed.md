# oEmbed Integration

DevJournal now supports automatic embedding of rich content from supported providers using the oEmbed protocol.

## How It Works

When you add a standalone URL on its own line in your markdown entry, DevJournal will automatically attempt to convert it to an embedded version of that content.

### Example

```markdown
# My Entry

Check out this great video:

https://www.youtube.com/watch?v=dQw4w9WgXcQ

That was really helpful!
```

The YouTube URL will be automatically converted to an embedded video player when the entry is saved.

## Supported Providers

The following providers are currently supported:

- **Video**: YouTube, Vimeo
- **Social Media**: Twitter/X, Instagram, TikTok, Reddit
- **Audio**: SoundCloud, Spotify
- **Code**: CodePen
- **Presentations**: SlideShare, SpeakerDeck
- **Images**: Flickr

## Important Notes

### Only Standalone URLs Are Converted

- ✅ **Will be embedded**: URLs on their own line

  ```markdown
  https://www.youtube.com/watch?v=abc123
  ```

- ❌ **Will NOT be embedded**: URLs in markdown links

  ```markdown
  [Watch this video](https://www.youtube.com/watch?v=abc123)
  ```

- ❌ **Will NOT be embedded**: Inline URLs within text
  ```markdown
  Check out https://www.youtube.com/watch?v=abc123 for more info
  ```

### Security

All embedded content is automatically sanitized using DOMPurify to prevent XSS attacks. Only safe HTML tags and attributes are allowed.

### Fallback Behavior

If oEmbed data cannot be fetched for a URL (e.g., network error, unsupported provider), the original URL will be preserved as a regular link in your entry.

### Timeouts

oEmbed requests have a 5-second timeout. If a provider doesn't respond within this time, the original URL is preserved.

## Technical Implementation

### Architecture

1. **OEmbedService** (`app/services/oembed_service.ts`)

   - Detects supported URLs
   - Fetches oEmbed data from provider endpoints
   - Sanitizes embedded HTML with DOMPurify

2. **ContentProcessorService** (`app/services/content_processor_service.ts`)

   - Processes markdown content before HTML conversion
   - Identifies standalone URLs
   - Replaces them with embedded content

3. **CSS Styling** (`resources/css/app.css`)
   - Responsive containers for embeds
   - Dark mode support
   - Proper spacing and shadows

### Dependencies

- `@extractus/oembed-extractor`: oEmbed data extraction
- `jsdom`: DOM implementation for Node.js (required by DOMPurify)
- `dompurify`: HTML sanitization

## Troubleshooting

### Embed Not Showing

1. **Check the URL format**: Ensure the URL is on its own line with no surrounding text
2. **Verify provider support**: Check if the provider is in the supported list
3. **Network connectivity**: Ensure the application can reach the provider's oEmbed endpoint
4. **Provider availability**: Some providers may have rate limits or be temporarily unavailable

### Styling Issues

The embedded content uses the `.oembed-embed` CSS class. You can customize the styling in `resources/css/app.css`.

## Future Enhancements

Potential improvements for the feature:

- **Caching**: Cache oEmbed responses to reduce API calls
- **Configuration**: Add user-configurable timeout and provider settings
- **More Providers**: Add support for additional oEmbed providers
- **Preview in Editor**: Show embed previews in the markdown editor
- **Fallback Images**: Show thumbnail images when full embeds fail to load

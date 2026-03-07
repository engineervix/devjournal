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

- **Video & Screen Recording**: YouTube, Vimeo, Loom, Streamable, TED
- **Social**: Twitter/X, Bluesky, Instagram, TikTok, Reddit
- **Audio**: SoundCloud, Spotify
- **Code & Playgrounds**: CodePen, CodeSandbox, Replit, RunKit, Observable, Wokwi, Marimo
- **Design & Diagrams**: Figma, Miro, Whimsical, Overflow
- **Presentations & Slides**: SlideShare, SpeakerDeck
- **Images & Media**: Flickr

## Important Notes

### Only Standalone URLs Are Converted

- ✓ **Will be embedded**: URLs on their own line

  ```markdown
  https://www.youtube.com/watch?v=abc123
  ```

- ✗ **Will NOT be embedded**: URLs in markdown links

  ```markdown
  [Watch this video](https://www.youtube.com/watch?v=abc123)
  ```

- ✗ **Will NOT be embedded**: Inline URLs within text
  ```markdown
  Check out https://www.youtube.com/watch?v=abc123 for more info
  ```

### Security

All embedded content is automatically sanitized using DOMPurify to prevent XSS attacks. Only safe HTML tags and attributes are allowed.

### Fallback Behavior

If oEmbed data cannot be fetched for a URL (e.g., network error, unsupported provider), the original URL will be preserved as a regular link in your entry.

### Timeouts

oEmbed requests have a 5-second timeout. If a provider doesn't respond within this time, the original URL is preserved.

## Troubleshooting

### Embed Not Showing

1. **Check the URL format**: Ensure the URL is on its own line with no surrounding text
2. **Verify provider support**: Check if the provider is in the supported list above
3. **Network connectivity**: Ensure the application can reach the provider's oEmbed endpoint
4. **Provider availability**: Some providers may have rate limits or be temporarily unavailable

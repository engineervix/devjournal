# DevLog CLI

Command-line interface for DevJournal - create journal entries from your terminal.

## Installation

Download the latest release from [GitHub Releases](https://github.com/engineervix/devjournal/releases).

**Linux/macOS:**

```bash
# Download and extract
wget https://github.com/engineervix/devjournal/releases/latest/download/devlog-client-linux-amd64
chmod +x devlog-client-linux-amd64
sudo mv devlog-client-linux-amd64 /usr/local/bin/devlog-client

# Verify
devlog-client version
```

**Windows:**
Download `devlog-client-windows-amd64.exe`, add to PATH, then run `devlog-client.exe version`

**Build from source:**

```bash
just build-cli
# Binary: dist/cli/devlog-client
```

## Quick Start

First, on the server, create a token using:

```bash
node ace make:token user@example.com "Token Name"
```

> [!NOTE]
> Copy the token and save it somewhere safe. You'll need it to authenticate with the API.

Then, on your client machine:

```bash
# Configure API URL
devlog-client config set-url https://your-journal.example.com/api/v1

# Paste the token when prompted by the following command:
devlog-client login

# Create entry
devlog-client add --type daily
```

## Commands

### `config set-url <URL>`

Set your DevJournal API URL.

### `config view`

View current configuration.

### `login`

Authenticate with API token.

### `list [flags]`

List journal entries.

**Flags:**

- `-p, --page` - Page number (default 1)
- `-n, --per-page` - Items per page (default 10)
- `-t, --type` - Filter by entry type
- `--tag` - Filter by tag
- `--json` - Output as JSON

### `update <ID> [flags]`

Update an existing journal entry. If no update flags are provided, opens your editor with current content.

**Flags:**

- `--title` - Update title without opening editor

### `add [flags] [content]`

Create a journal entry.

**Flags:**

- `-t, --type` - Entry type: `daily` (default), `til`, `snippet`, `debug`, `achievement`
- `--tags` - Comma-separated tags
- `--title` - Custom title
- `-q, --quick` - Skip editor, read from args or stdin

**Examples:**

```bash
# Open editor
devlog-client add -t til --tags "go,cli"

# Quick mode
devlog-client add -q "Fixed authentication bug"
git log --oneline -5 | devlog-client add -q -t snippet
```

### `version`

Show version information.

## Configuration

Stored in `~/.config/devlog-client/config.json`:

```json
{
  "api_url": "https://your-journal.example.com/api/v1",
  "api_token": "your-token-here"
}
```

## Development

**Run tests:**

```bash
just test-cli
```

**Test coverage:**

```bash
just test-cli-coverage
```

**Build:**

```bash
just build-cli
```

## Releasing

Releases are automated via GitHub Actions. When a tag is pushed:

1. App and CLI tests run
2. CLI binaries built for 6 platforms (Linux/macOS/Windows × amd64/arm64)
3. Release created with changelog and binaries attached

**Create a release:**

```bash
# Ensure tests pass
just test-cli

# Tag and push
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Workflow: `.github/workflows/ci.yml`

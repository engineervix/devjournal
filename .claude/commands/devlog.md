Help the user save a note to their DevJournal from this conversation.

Follow these steps in order, waiting for user input at each confirmation step:

## Step 1 — Ask what to save

Ask the user: "What would you like to capture from our conversation?" Give a few examples relevant to what we discussed (e.g. the fix we found, the concept we covered, the snippet we wrote). Wait for their answer.

## Step 2 — Draft the content

Write the journal entry in markdown based on their answer. Be concise and useful — written for their future self. Include relevant code blocks if applicable.

## Step 3 — Detect entry type and confirm

Pick the best type based on the content:

- `til` — something learned, a new concept or technique
- `snippet` — a reusable piece of code
- `debug` — a bug diagnosed and fixed
- `achievement` — something completed or shipped
- `daily` — general notes, progress, reflections

Show your choice with a one-line reason and ask the user to confirm or choose a different type. Wait for their answer.

## Step 4 — Suggest tags and confirm

Suggest 2–5 tags based on the content (technologies, topics, concepts). Show them and ask the user to confirm or edit. If the user wants no tags, skip the `--tags` flag entirely. Wait for their answer.

## Step 5 — Save the entry

Once type and tags are confirmed:

1. Use the Write tool to save the content to `~/.cache/devlog_entry.md`
2. Run (omit `--tags` if user chose none):

```bash
devlog add --type <type> --title "<concise title>" --tags "<tag1>,<tag2>" -q < ~/.cache/devlog_entry.md
```

3. Delete the temp file:

```bash
trash ~/.cache/devlog_entry.md
```

Report the result. If there's an error, show it clearly.

# DevJournal

A modern developer journal application built with [AdonisJS](https://adonisjs.com/), designed to help developers track their learning journey, code snippets, debugging sessions, and achievements.

[![Node v24](https://img.shields.io/badge/Node-v24-teal.svg)](https://nodejs.org/en/blog/release/v24.0.0)
[![code style: prettier](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg)](https://prettier.io/)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents** _generated with [DocToc](https://github.com/thlorenz/doctoc)_

- [Features](#features)
  - [📝 **Entry Types**](#-entry-types)
  - [🎨 **User Experience**](#-user-experience)
  - [🔧 **Technical Features**](#-technical-features)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Development](#development)
  - [Available Scripts](#available-scripts)
  - [Database Commands](#database-commands)
  - [Project Structure](#project-structure)
- [Usage](#usage)
  - [Creating Entries](#creating-entries)
  - [Searching](#searching)
  - [Keyboard Shortcuts](#keyboard-shortcuts)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features

### 📝 **Entry Types**

- **Daily Logs**: Track daily development activities
- **Today I Learned (TIL)**: Document new knowledge and concepts
- **Code Snippets**: Store useful code samples with explanations
- **Debug Sessions**: Record problem-solving processes
- **Achievements**: Celebrate development milestones

### 🎨 **User Experience**

- **Modern UI**: Clean, responsive design with dark mode support
- **Markdown Editor**: Write-and-preview markdown editor with templates
- **Tag System**: Organize entries with tags and usage tracking
- **Full-text Search**: PostgreSQL-powered search across all content
- **Keyboard Shortcuts**: Quick navigation and entry creation
- **Export**: Export entries as ZIP or single markdown file

### 🔧 **Technical Features**

- **AdonisJS 6**: Modern Node.js framework
- **PostgreSQL**: Robust database with full-text search
- **Tailwind CSS**: Utility-first CSS framework
- **Alpine.js**: Lightweight JavaScript framework
- **TypeScript**: Type-safe development
- **Edge Templates**: Server-side rendering

## Quick Start

### Prerequisites

- Node.js 24+
- PostgreSQL 16+
- npm

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd devjournal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment**

   ```bash
   cp -v .env.example .env
   cp -v .env.test.example .env.test
   # Check `.env` & `.env.test` to see if there's anything you need to edit
   ```

4. **Start the postgres container**

   ```bash
   docker compose -f docker/docker-compose.dev.yml up -d
   ```

5. **Run migrations**

   ```bash
   node ace migration:run
   ```

6. **Create your user account**

   ```bash
   node ace create:user
   ```

7. **Start development server**

   ```bash
   npm run dev
   ```

8. **Visit the application**
   Open http://localhost:3333 in your browser

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm test:coverage` - Run tests and show test coverage
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking

### Database Commands

- `node ace migration:run` - Run pending migrations
- `node ace migration:rollback` - Rollback last migration
- `node ace migration:status` - Check migration status

### Project Structure

```
├── app/
│   ├── controllers/     # HTTP controllers
│   ├── models/         # Database models
│   ├── services/       # Business logic
│   ├── middleware/     # HTTP middleware
│   └── exceptions/     # Exception handlers
├── database/
│   ├── migrations/     # Database migrations
│   └── factories/      # Model factories
├── resources/
│   ├── views/          # Edge templates
│   ├── css/           # Stylesheets
│   └── js/            # JavaScript files
├── start/             # Application bootstrap
└── tests/             # Test files
```

## Usage

### Creating Entries

1. Click the "+" button or use `Cmd/Ctrl + N`
2. Select an entry type (Daily, TIL, Snippet, Debug, Achievement)
3. Use the provided templates or write custom content
4. Optionally add tags for organization
5. Save with `Cmd/Ctrl + S`

### Searching

- Use the search bar in the header
- Search across titles and content
- Filter by entry type, date range, or tags

### Keyboard Shortcuts

- `Cmd/Ctrl + N` - New entry
- `Cmd/Ctrl + /` - Focus search
- `Cmd/Ctrl + S` - Save entry (in forms)

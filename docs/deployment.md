# Production Deployment Guide

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents**

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
  - [Required Variables](#required-variables)
  - [Generate Application Key](#generate-application-key)
- [Deployment](#deployment)
  - [Initial Deployment](#initial-deployment)
  - [Verify Deployment](#verify-deployment)
- [Docker Compose Setup](#docker-compose-setup)
  - [Services](#services)
  - [Startup Process](#startup-process)
- [Maintenance](#maintenance)
  - [Updating Application](#updating-application)
  - [Database Maintenance](#database-maintenance)
  - [Backups](#backups)
- [Monitoring](#monitoring)
  - [Viewing Logs](#viewing-logs)
  - [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)
  - [Application Won't Start](#application-wont-start)
  - [Database Connection Issues](#database-connection-issues)
  - [Backup Failures](#backup-failures)
- [Security Notes](#security-notes)
- [Additional Resources](#additional-resources)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Overview

DevJournal deploys using Docker Compose with:

- **Traefik** - Reverse proxy with automatic HTTPS
- **PostgreSQL 16 + pgvector** - Database with vector search
- **Automated backups** - Daily dumps to Backblaze B2
- **LGTM Stack** - Optional monitoring (Loki, Grafana, Tempo, Mimir)

This guide assumes you have a Linux VPS with Docker and the infrastructure already configured.

## Prerequisites

**Required:**

- Ubuntu VPS (or similar) with Docker Engine & Docker Compose V2
- Domain name with DNS pointing to server IP
- Traefik setup with `traefik-public` network ([setup guide](https://gitlab.com/engineervix/run-core-traefik))
- Backblaze B2 account with application key and bucket

**Optional:**

- LGTM monitoring stack ([setup guide](https://gitlab.com/engineervix/run-core-monitoring))

**Verify prerequisites:**

```bash
docker --version        # Should be 24.x.x+
docker compose version  # Should be v2.x.x+
docker network ls       # Should show 'traefik-public'
```

## Quick Start

For experienced users who have infrastructure ready:

```bash
# 1. Clone and configure
git clone <repo-url> /opt/devjournal && cd /opt/devjournal
cp .env.example .env
# Edit .env with your values

# 2. Generate app key
docker run --rm -v $(pwd):/app -w /app node:22-slim \
  sh -c "npm install && node ace generate:key"
# Copy output to APP_KEY in .env

# 3. Deploy
docker compose build --no-cache
docker compose up -d

# 4. Create first user
docker compose exec app node ace create:user

# 5. Verify at https://your-domain.com
```

## Environment Configuration

### Required Variables

Create `.env` from `.env.example` and configure:

```bash
# Application
APP_KEY=<generated-key>              # From generate:key command
DOMAIN_NAME=devjournal.yourdomain.com
APP_NAME=DevJournal

# Database
POSTGRES_USER=devjournal
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=devjournal

# Backblaze B2 (for backups)
B2_APPLICATION_KEY_ID=<your-key-id>
B2_APPLICATION_KEY=<your-application-key>
B2_ENDPOINT=<s3-endpoint>            # e.g., s3.us-west-002.backblazeb2.com
B2_BUCKET_NAME=<your-bucket>
B2_REGION=<region>

# Optional: Error tracking
SENTRY_DSN=<your-sentry-dsn>

# Optional: Bot protection
TURNSTILE_SITE_KEY=<site-key>
TURNSTILE_SECRET_KEY=<secret-key>

# Optional: Notifications
NOTIFICATION_URL=<webhook-url>       # For backup failure alerts
```

### Generate Application Key

```bash
docker run --rm -v $(pwd):/app -w /app node:22-slim \
  sh -c "npm install && node ace generate:key"
```

**Important:** This key encrypts session data and tokens. Never commit it. If lost, all sessions become invalid.

## Deployment

### Initial Deployment

```bash
# Build application image
docker compose build --no-cache

# Start all services
docker compose up -d

# Check service status
docker compose ps
# Expected: devjournal-app (healthy), devjournal-db (healthy), devjournal-backup (up)

# Watch logs for successful startup
docker compose logs -f app
# Look for: migrations completed, server listening on port 3000

# Create first user
docker compose exec app node ace create:user
```

### Verify Deployment

1. **Web interface:** Visit `https://devjournal.yourdomain.com`

   - Should show login page with valid SSL certificate
   - Log in with credentials from previous step

2. **Traefik dashboard:** Check routing is configured

   - Service should appear with Let's Encrypt certificate

3. **Grafana (if configured):** Check logs with `{stackname="devjournal"}`

4. **Backups:** Verify backup service initialized
   ```bash
   docker compose logs backup
   # Backups run daily at 4:05 AM
   ```

## Docker Compose Setup

### Services

**app** - AdonisJS application

- Runs on port 3000 internally
- Waits for database health check
- Automatically runs migrations on startup
- Traefik routes external traffic with automatic HTTPS

**db** - PostgreSQL 16 with pgvector

- Persistent storage via `postgres_data` volume
- Health checks every 30 seconds
- Backup pre-hook dumps database before backup runs

**backup** - Automated backup service

- Runs daily at 4:05 AM (local timezone)
- Uploads to Backblaze B2
- Local retention: 2 days
- Sends webhook notification on errors

### Startup Process

1. **Database starts** → Health check passes (`pg_isready`)
2. **App waits** → Won't start until DB healthy
3. **Migrations run** → Automatic via `entrypoint.sh`
4. **App starts** → Listens on port 3000
5. **Traefik routes** → External traffic forwarded to app

## Maintenance

### Updating Application

When you push new code:

```bash
cd /opt/devjournal
git pull origin main
docker compose build --no-cache app
docker compose down
docker compose up -d
docker compose logs -f app  # Verify startup
```

Migrations run automatically on startup.

### Database Maintenance

**Check database size:**

```bash
docker compose exec db psql -U devjournal -d devjournal \
  -c "SELECT pg_size_pretty(pg_database_size('devjournal'));"
```

**Vacuum database (monthly):**

```bash
docker compose exec db psql -U devjournal -d devjournal -c "VACUUM ANALYZE;"
```

**Reindex (if queries slow):**

```bash
docker compose exec db psql -U devjournal -d devjournal -c "REINDEX DATABASE devjournal;"
```

### Backups

**Automated backups:**

- Run daily at 4:05 AM automatically
- Stored as `devjournal-backup-YYYYMMDD-HHMMSS.tar.gz` in B2
- Local backups cleaned after 2 days

**Manual backup:**

```bash
docker compose exec backup backup
```

**Restore from backup:**

```bash
# 1. Download backup from B2 and extract
tar -xzf devjournal-backup-20260212-040500.tar.gz
cd backup/database_dump/

# 2. Stop application
docker compose stop app

# 3. Restore database
gunzip -c postgres_dump_*.gz | \
  docker compose exec -T db pg_restore \
  -U devjournal -d devjournal --clean --if-exists

# 4. Restart application
docker compose start app

# 5. Verify data integrity
docker compose exec db psql -U devjournal -d devjournal \
  -c "SELECT COUNT(*) FROM entries;"
```

## Monitoring

### Viewing Logs

**Application logs:**

```bash
docker compose logs -f app           # Follow live
docker compose logs --tail=100 app   # Last 100 lines
```

**Database logs:**

```bash
docker compose logs -f db
```

**All services:**

```bash
docker compose logs -f
```

**Grafana (if LGTM stack configured):**

- Query: `{stackname="devjournal"}`
- Filter by container: `{container_name="devjournal-app"}`
- Search errors: `{stackname="devjournal"} |= "error"`

### Health Checks

**Weekly:**

- [ ] Application accessible via HTTPS
- [ ] No errors in logs
- [ ] Backups running successfully
- [ ] SSL certificate valid
- [ ] Disk space < 80%

**Monthly:**

- [ ] Update application code
- [ ] Update Docker images
- [ ] Run database VACUUM
- [ ] Test backup restore
- [ ] Review B2 retention

## Troubleshooting

### Application Won't Start

**Check logs:**

```bash
docker compose logs app
```

**Common issues:**

1. **Missing APP_KEY**

   ```
   Error: E_MISSING_APP_KEY
   ```

   **Fix:** Generate key and add to `.env` (see Environment Configuration)

2. **Migration errors**

   ```
   Error: Migration failed
   ```

   **Fix:** Check database connectivity:

   ```bash
   docker compose exec db pg_isready -U devjournal
   ```

3. **Port conflict**
   ```
   Error: Port 3000 is already in use
   ```
   **Fix:** Check for conflicting services:
   ```bash
   docker ps | grep 3000
   ```

### Database Connection Issues

**Check database health:**

```bash
docker compose exec db pg_isready -U devjournal -d devjournal
```

**Check connection from app:**

```bash
docker compose exec app node ace db:check
```

**Common fixes:**

- Wait for database health check to pass
- Verify `POSTGRES_*` variables in `.env` match between services
- Check `docker compose logs db` for errors

### Backup Failures

**Check backup logs:**

```bash
docker compose logs backup
```

**Common issues:**

1. **B2 authentication failed**

   - Verify `B2_APPLICATION_KEY_ID` and `B2_APPLICATION_KEY` in `.env`
   - Check key permissions in B2 dashboard

2. **Bucket not found**

   - Verify `B2_BUCKET_NAME` exists
   - Check `B2_ENDPOINT` and `B2_REGION` are correct

3. **Disk space full**
   ```bash
   df -h
   ```
   **Fix:** Free up space or increase server storage

**For SSL/certificate issues:** Check Traefik logs (`docker logs traefik`)

**For performance issues:** Check resource usage (`docker stats`)

## Security Notes

**Essential practices:**

- Never commit `.env` to version control
- Use strong passwords (32+ characters, random)
- Rotate API tokens periodically
- Keep PostgreSQL and Docker images updated
- Database is isolated within Docker network (not exposed externally)
- HTTPS enforced via Traefik
- Security headers configured (HSTS, XSS protection, content sniffing prevention)

**Backup security:**

- B2 supports encryption at rest
- Use application keys with minimal permissions (read/write only)
- Test restores regularly to verify backup integrity

**Server hardening** (not handled by DevJournal):

- Configure firewall (UFW) to allow only ports 22, 80, 443
- Disable password SSH authentication (use keys)
- Install fail2ban for brute-force protection
- Enable automatic security updates

## Additional Resources

**Infrastructure:**

- [Traefik Setup](https://gitlab.com/engineervix/run-core-traefik)
- [LGTM Monitoring](https://gitlab.com/engineervix/run-core-monitoring)

**Official Documentation:**

- [AdonisJS Deployment](https://docs.adonisjs.com/guides/deployment)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Traefik](https://doc.traefik.io/traefik/)

**Tools:**

- [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
- [Docker Volume Backup](https://github.com/offen/docker-volume-backup)
- [pgvector](https://github.com/pgvector/pgvector)

**Need help?**

1. Check logs: `docker compose logs <service>`
2. Review this guide
3. Check `docs/architecture.md` for system design
4. Ask in AdonisJS Discord: https://discord.gg/vDcEjq6

---

**Last Updated:** 2026-02-12
**Version:** Docker Compose V2 with Traefik integration

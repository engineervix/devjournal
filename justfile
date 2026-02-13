export PATH := "./node_modules/.bin:" + env_var('PATH')
DOCKER_COMPOSE_DEV := "docker compose -f docker/docker-compose.dev.yml --env-file .env"

default:
    just --list

# docker-compose up
up *build:
    if [[ "{{build}}" =~ ^(-b|b|build|--build)$ ]]; then \
        {{DOCKER_COMPOSE_DEV}} up -d --build; \
    elif [[ "{{build}}" = "" ]]; then \
        {{DOCKER_COMPOSE_DEV}} up -d; \
    else \
        echo "{{build}} doesn't match any of -b, b, build or --build"; \
    fi

# docker-compose exec [container] [command(s)]
exec container +command:
    {{DOCKER_COMPOSE_DEV}} exec {{container}} "{{command}}"

# docker-compose logs [container] [-f (Follow log output)]
logs container *follow:
    if [[ "{{follow}}" =~ ^(-f|f|follow|--follow)$ ]]; then \
        {{DOCKER_COMPOSE_DEV}} logs {{container}} -f; \
    elif [[ "{{follow}}" = "" ]]; then \
        {{DOCKER_COMPOSE_DEV}} logs {{container}}; \
    else \
        echo "{{follow}} doesn't match any of -f, f, follow or --follow"; \
    fi

# docker-compose stop
stop:
    {{DOCKER_COMPOSE_DEV}} stop

# docker-compose down [-v]
down *volumes:
    if [[ "{{volumes}}" =~ ^(-v|v|--vol|vol|volumes|--volumes)$ ]]; then \
        {{DOCKER_COMPOSE_DEV}} down -v; \
    elif [[ "{{volumes}}" = "" ]]; then \
        {{DOCKER_COMPOSE_DEV}} down; \
    else \
        echo "{{volumes}} doesn't match any of -v, v, vol, --vol, volumes or --volumes"; \
    fi

# `git commit` but with a cz prompt
commit:
    npm run commitlint

# create a release (bump, auto tag & generate changelog)
bump *first:
    #!/usr/bin/env node
    (async () => {
        const isFirst = /^(first|-f|f|--first)$/;
        const arg = "{{first}}";
        const { execSync } = await import("child_process");
        const { version, name } = require('{{invocation_directory()}}/package.json');
        if (isFirst.test(arg)) {
            console.info("Generating your changelog for your first release ...");
            execSync(
                `npm run release -- --first-release --releaseCommitMessageFormat "chore: this is ${name} v{{{{currentTag}}🎉"`,
                { stdio: "inherit" }
            );
        } else {
            console.info(`Creating a new release ...`);
            execSync(
                `npm run release -- --releaseCommitMessageFormat "chore: ✈️ bump ${name} (${version} → v{{{{currentTag}})"`,
                { stdio: "inherit" }
            );
        }
    })();

# [🤖 CI task] extract content from CHANGELOG.md for use in Gitlab/Github Releases
release-notes:
    #!/usr/bin/env node
    (() => {
        // we read the CHANGELOG.md file and loop through line by line
        // we wanna extract content beginning from the first Heading 2 text
        // to the last line before the next Heading 2 text
        const fs = require('fs');
        const path = require('path');
        const patternToMatch = '## ';
        let count = 0;
        const lines = [];
        const headingText = "## What's changed in this release\n";
        lines.push(headingText);
        const changelogPath = path.resolve("{{invocation_directory()}}/CHANGELOG.md");
        const changelogContent = fs.readFileSync(changelogPath, 'utf8');
        const changelogLines = changelogContent.split('\n');
        for (const line of changelogLines) {
            if (line.startsWith(patternToMatch) && count === 0) {
                count += 1;
            } else if (!line.startsWith(patternToMatch) && count === 1) {
                lines.push(line + '\n');
            } else if (line.startsWith(patternToMatch) && count === 1) {
                break;
            }
        }
        const releaseNotesPath = path.join("{{invocation_directory()}}", '../', 'LATEST_RELEASE_NOTES.md');
        fs.writeFileSync(releaseNotesPath, lines.join(''), 'utf8');
    })();

# Build the CLI tool
build-cli:
    @mkdir -p dist/cli
    cd cli && go build -ldflags="-s -w -X main.version=$(git describe --tags --always 2>/dev/null || echo 'dev')-dev -X main.commit=$(git rev-parse --short HEAD) -X main.date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o ../dist/cli/devlog-client main.go

# 🧪 Run CLI tests with better output formatting
test-cli:
    @echo "🧪 Running tests..."
    cd cli && gotestsum --format=pkgname-and-test-fails ./...

# 🏃‍♂️ Run CLI tests with coverage
test-cli-coverage:
    cd cli && go test -v -coverprofile=coverage.out ./...
    cd cli && go tool cover -html=coverage.out -o coverage.html
    @echo "Coverage report generated: cli/coverage.html"

# 🧹 Formats all Go source files in the project.
fmt-cli:
    @echo "Formatting code..."
    cd cli && go fmt ./...

# 🔎 Vets the code for potential bugs and suspicious constructs.
vet-cli:
    @echo "Vetting code..."
    cd cli && go vet ./...

# ✅ Runs both the formatter and the vet tool sequentially.
check-cli: fmt-cli vet-cli

# Run CLI benchmarks
bench-cli:
    cd cli && go test -bench=. -benchmem ./...


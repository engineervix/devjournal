#!/bin/bash

# the script should exit whenever it encounters an error
set -o errexit
# exit execution if one of the commands in the pipe fails.
set -o pipefail
# exit when the script tries to use undeclared variables.
set -o nounset

# Run database migrations
# The --force flag is required when running migrations in the production environment.
# https://docs.adonisjs.com/guides/getting-started/deployment#migrating-database
node ace migration:run --force

# Finally, run whatever command was passed (`npm run start`)
exec "$@"

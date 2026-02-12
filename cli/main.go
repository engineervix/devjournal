package main

import "github.com/engineervix/devjournal/cli/cmd"

// Version information (set by GoReleaser)
var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	// Pass version info to cmd package
	cmd.Version = version
	cmd.Commit = commit
	cmd.Date = date

	cmd.Execute()
}

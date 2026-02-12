package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var (
	// Version info (injected at build time by GoReleaser)
	Version = "dev"
	Commit  = "none"
	Date    = "unknown"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version information",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("devlog version %s\n", Version)
		fmt.Printf("  commit: %s\n", Commit)
		fmt.Printf("  built:  %s\n", Date)
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}

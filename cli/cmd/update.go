package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/engineervix/devjournal/cli/internal/api"
	"github.com/engineervix/devjournal/cli/internal/editor"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	updateTitle string
	updateType  string
)

var updateCmd = &cobra.Command{
	Use:   "update <ID>",
	Short: "Update a journal entry",
	Example: `  devlog-client update 123e4567-e89b-12d3
  devlog-client update 123e4567-e89b-12d3 --title "Fixed a typo"`,
	Args: cobra.MinimumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		token := viper.GetString("api_token")
		if token == "" {
			fmt.Fprintln(os.Stderr, "Error: missing API token. Please login first using 'devlog-client login'")
			return
		}

		// This is a simplification. The user might pass an ID or a search query.
		// For now, we assume it's an ID if it looks like a UUID, or we might need a search helper?
		// The implementation plan says "Arguments: id".
		// But the previous thoughts discussed list filtering.
		// Let's stick to ID for now as per plan.
		id := args[0]

		apiClient := api.NewClient(viper.GetString("api_url"), token)

		// Interactive mode if no specific flags that define all needed updates are provided
		// In this case, if title is provided, we might still want to edit content?
		// The plan said: "Interactive Mode (Default): If no flags causing updates are provided".
		interactive := updateTitle == "" && updateType == ""

		if interactive {
			// Fetch entry first
			entry, err := apiClient.GetEntry(id)
			if err != nil {
				fmt.Fprintf(os.Stderr, "✗ Error fetching entry: %v\n", err)
				return
			}

			updatedContent, err := editor.OpenEditor(entry.ContentMarkdown, ".md")
			if err != nil {
				fmt.Fprintf(os.Stderr, "Error opening editor: %v\n", err)
				return
			}

			if strings.TrimSpace(updatedContent) == "" {
				fmt.Fprintln(os.Stderr, "Error: empty entry content, aborting update.")
				return
			}

			// Only update if content changed?
			// Or just send it.

			payload := api.UpdateEntryPayload{
				ContentMarkdown: updatedContent,
			}
			if updateTitle != "" {
				payload.Title = updateTitle
			}
			if updateType != "" {
				payload.EntryType = updateType
			}

			updatedEntry, err := apiClient.UpdateEntry(id, payload)
			if err != nil {
				fmt.Printf("✗ %s\n", err)
				return
			}
			fmt.Printf("✓ Entry updated successfully! (ID: %s)\n", updatedEntry.ID)

		} else {
			// Flag only updates
			payload := api.UpdateEntryPayload{}
			if updateTitle != "" {
				payload.Title = updateTitle
			}
			if updateType != "" {
				payload.EntryType = updateType
			}

			updatedEntry, err := apiClient.UpdateEntry(id, payload)
			if err != nil {
				fmt.Printf("✗ %s\n", err)
				return
			}
			fmt.Printf("✓ Entry updated successfully! (ID: %s)\n", updatedEntry.ID)
		}
	},
}

func init() {
	rootCmd.AddCommand(updateCmd)
	updateCmd.Flags().StringVar(&updateTitle, "title", "", "New title for the entry")
	updateCmd.Flags().StringVar(&updateType, "type", "", "New entry type (daily, til, snippet, debug, achievement)")
}

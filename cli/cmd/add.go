package cmd

import (
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/engineervix/devjournal/cli/internal/api"
	"github.com/engineervix/devjournal/cli/internal/editor"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	entryType  string
	entryTags  []string
	entryTitle string
	quickMode  bool
)

var addCmd = &cobra.Command{
	Use:   "add",
	Short: "Create a new journal entry",
	Run: func(cmd *cobra.Command, args []string) {
		token := viper.GetString("api_token")
		if token == "" {
			fmt.Println("Please login first using 'devlog login'")
			return
		}

		apiClient := api.NewClient(viper.GetString("api_url"), token)

		// determine content
		var content string

		if quickMode {
			// Quick mode: get content from args or stdin
			if len(args) > 0 {
				// Use arguments as content
				content = strings.Join(args, " ")
			} else {
				// Read from stdin
				fmt.Println("Reading from stdin... (Press Ctrl+D when done)")
				stdinBytes, err := io.ReadAll(os.Stdin)
				if err != nil {
					fmt.Println("Error reading from stdin:", err)
					return
				}
				content = string(stdinBytes)
			}

			if strings.TrimSpace(content) == "" {
				fmt.Println("Empty entry, aborting.")
				return
			}
		} else {
			// Standard mode: open editor
			// Add a helpful comment at the top
			helpText := "<!-- Write your entry below. The first line can be a heading if you wish. -->\n\n"

			var err error
			content, err = editor.OpenEditor(helpText, ".md")
			if err != nil {
				fmt.Println("Error opening editor:", err)
				return
			}

			// Remove the help comment if it's still there
			content = strings.Replace(content, "<!-- Write your entry below. The first line can be a heading if you wish. -->\n\n", "", 1)

			if strings.TrimSpace(content) == "" {
				fmt.Println("Empty entry, aborting.")
				return
			}
		}

		// API Request
		payload := api.CreateEntryPayload{
			EntryType:       entryType,
			Title:           entryTitle,
			ContentMarkdown: content,
			Tags:            entryTags,
		}

		entry, err := apiClient.CreateEntry(payload)
		if err != nil {
			fmt.Printf("✗ %s\n", err)
			return
		}

		fmt.Printf("✓ Entry created successfully! (ID: %s)\n", entry.ID)
	},
}

func init() {
	rootCmd.AddCommand(addCmd)

	addCmd.Flags().StringVarP(&entryType, "type", "t", "daily", "Type of entry (daily, til, snippet, debug, achievement)")
	addCmd.Flags().StringSliceVar(&entryTags, "tags", []string{}, "Comma-separated tags")
	addCmd.Flags().StringVar(&entryTitle, "title", "", "Title of the entry")
	addCmd.Flags().BoolVarP(&quickMode, "quick", "q", false, "Quick mode: read content from arguments or stdin instead of opening editor")
}

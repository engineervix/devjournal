package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"text/tabwriter"
	"time"

	"github.com/engineervix/devjournal/cli/internal/api"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	listPage    int
	listPerPage int
	listType    string
	listTag     string
	listJSON    bool
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List journal entries",
	Run: func(cmd *cobra.Command, args []string) {
		token := viper.GetString("api_token")
		if token == "" {
			fmt.Println("Please login first using 'devlog login'")
			return
		}

		apiClient := api.NewClient(viper.GetString("api_url"), token)

		entries, err := apiClient.GetEntries(api.GetEntriesOptions{
			Page:    listPage,
			PerPage: listPerPage,
			Type:    listType,
			Tag:     listTag,
			JSON:    listJSON,
		})
		if err != nil {
			fmt.Printf("✗ %s\n", err)
			return
		}

		if listJSON {
			encoder := json.NewEncoder(os.Stdout)
			encoder.SetIndent("", "  ")
			encoder.Encode(entries)
			return
		}

		if len(entries) == 0 {
			fmt.Println("No entries found.")
			return
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 3, ' ', 0)
		fmt.Fprintln(w, "ID\tDATE\tTYPE\tTITLE\tTAGS")

		for _, e := range entries {
			dateStr := e.CreatedAt
			if t, err := time.Parse(time.RFC3339, e.CreatedAt); err == nil {
				dateStr = t.Format("2006-01-02 15:04")
			}

			title := e.Title
			if title == "" {
				// Create a snippet from content if title is empty
				lines := strings.Split(e.ContentMarkdown, "\n")
				if len(lines) > 0 {
					title = lines[0]
					if len(title) > 50 {
						title = title[:47] + "..."
					}
				} else {
					title = "(no title)"
				}
			}

			tags := []string{}
			for _, t := range e.Tags {
				tags = append(tags, t.Name)
			}
			tagsStr := strings.Join(tags, ",")

			// Truncate ID for better display
			shortID := e.ID
			if len(shortID) > 8 {
				shortID = shortID[:8]
			}

			fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\n", shortID, dateStr, e.EntryType, title, tagsStr)
		}
		w.Flush()
	},
}

func init() {
	rootCmd.AddCommand(listCmd)
	listCmd.Flags().IntVarP(&listPage, "page", "p", 1, "Page number")
	listCmd.Flags().IntVarP(&listPerPage, "per-page", "n", 10, "Items per page")
	listCmd.Flags().StringVarP(&listType, "type", "t", "", "Filter by entry type")
	listCmd.Flags().StringVar(&listTag, "tag", "", "Filter by tag")
	listCmd.Flags().BoolVar(&listJSON, "json", false, "Output as JSON")
}

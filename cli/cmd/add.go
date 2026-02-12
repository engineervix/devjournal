package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"

	"github.com/go-resty/resty/v2"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	entryType  string
	entryTags  []string
	entryTitle string
	quickMode  bool
)

// API response structures
type APIError struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type ValidationError struct {
	Errors []struct {
		Field   string `json:"field"`
		Message string `json:"message"`
	} `json:"errors"`
}

type APISuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

var addCmd = &cobra.Command{
	Use:   "add",
	Short: "Create a new journal entry",
	Run: func(cmd *cobra.Command, args []string) {
		token := viper.GetString("api_token")
		if token == "" {
			fmt.Println("Please login first using 'devlog login'")
			return
		}

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
			editor := os.Getenv("EDITOR")
			if editor == "" {
				editor = "vim"
			}

			tmpFile, err := os.CreateTemp("", "devlog-*.md")
			if err != nil {
				fmt.Println("Error creating temp file:", err)
				return
			}
			defer os.Remove(tmpFile.Name())

			// Add a helpful comment at the top
			helpText := "<!-- Write your entry below. The first line can be a heading if you wish. -->\n\n"
			tmpFile.WriteString(helpText)

			tmpFile.Close()

			cmdExec := exec.Command(editor, tmpFile.Name())
			cmdExec.Stdin = os.Stdin
			cmdExec.Stdout = os.Stdout
			cmdExec.Stderr = os.Stderr

			if err := cmdExec.Run(); err != nil {
				fmt.Println("Error opening editor:", err)
				return
			}

			contentBytes, err := os.ReadFile(tmpFile.Name())
			if err != nil {
				fmt.Println("Error reading content:", err)
				return
			}
			content = string(contentBytes)

			// Remove the help comment if it's still there
			content = strings.Replace(content, "<!-- Write your entry below. The first line can be a heading if you wish. -->\n\n", "", 1)

			if strings.TrimSpace(content) == "" {
				fmt.Println("Empty entry, aborting.")
				return
			}
		}

		// API Request
		client := resty.New()
		resp, err := client.R().
			SetAuthToken(token).
			SetBody(map[string]interface{}{
				"entryType":       entryType,
				"title":           entryTitle,
				"contentMarkdown": content,
				"tags":            entryTags,
			}).
			Post(viper.GetString("api_url") + "/entries")

		if err != nil {
			fmt.Println("✗ Error sending request:", err)
			return
		}

		if resp.IsError() {
			// Try to parse as validation error (422)
			if resp.StatusCode() == 422 {
				var validationErr ValidationError
				if err := json.Unmarshal(resp.Body(), &validationErr); err == nil && len(validationErr.Errors) > 0 {
					fmt.Println("✗ Validation errors:")
					for _, e := range validationErr.Errors {
						fmt.Printf("  • %s: %s\n", e.Field, e.Message)
					}
					return
				}
			}

			// Try to parse as standard API error
			var apiErr APIError
			if err := json.Unmarshal(resp.Body(), &apiErr); err == nil && apiErr.Message != "" {
				fmt.Printf("✗ Error: %s\n", apiErr.Message)
				return
			}

			// Fallback to raw response
			fmt.Printf("✗ API Error (%s):\n%s\n", resp.Status(), resp.String())
			return
		}

		// Parse success response
		var successResp APISuccessResponse
		if err := json.Unmarshal(resp.Body(), &successResp); err == nil {
			if successResp.Message != "" {
				fmt.Printf("✓ %s\n", successResp.Message)
			} else {
				fmt.Println("✓ Entry created successfully!")
			}
		} else {
			fmt.Println("✓ Entry created successfully!")
		}
	},
}

func init() {
	rootCmd.AddCommand(addCmd)

	addCmd.Flags().StringVarP(&entryType, "type", "t", "daily", "Type of entry (daily, til, snippet, debug, achievement)")
	addCmd.Flags().StringSliceVar(&entryTags, "tags", []string{}, "Comma-separated tags")
	addCmd.Flags().StringVar(&entryTitle, "title", "", "Title of the entry")
	addCmd.Flags().BoolVarP(&quickMode, "quick", "q", false, "Quick mode: read content from arguments or stdin instead of opening editor")
}

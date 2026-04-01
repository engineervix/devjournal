package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Manage configuration",
	Long:  `View and modify configuration settings.`,
}

var setURLCmd = &cobra.Command{
	Use:   "set-url [URL]",
	Short: "Set the API URL for your DevJournal instance",
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		apiURL := args[0]

		// Basic validation - ensure it's a URL
		if apiURL == "" {
			fmt.Fprintln(os.Stderr, "Error: URL cannot be empty")
			return
		}

		viper.Set("api_url", apiURL)

		configDir, err := os.UserConfigDir()
		cobra.CheckErr(err)

		configPath := filepath.Join(configDir, "devlog-client", "config.json")

		// Ensure directory exists
		devlogConfigDir := filepath.Join(configDir, "devlog-client")
		if _, err := os.Stat(devlogConfigDir); os.IsNotExist(err) {
			os.MkdirAll(devlogConfigDir, 0700)
		}

		err = viper.WriteConfigAs(configPath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error saving config: %v\n", err)
			return
		}

		fmt.Printf("✓ API URL set to: %s\n", apiURL)
		fmt.Printf("Config saved to: %s\n", configPath)
	},
}

var viewCmd = &cobra.Command{
	Use:   "view",
	Short: "View current configuration",
	Run: func(cmd *cobra.Command, args []string) {
		apiURL := viper.GetString("api_url")
		token := viper.GetString("api_token")

		configDir, _ := os.UserConfigDir()
		configPath := filepath.Join(configDir, "devlog-client", "config.json")

		fmt.Println("Current Configuration")
		fmt.Println("━━━━━━━━━━━━━━━━━━━━━")
		fmt.Printf("API URL:     %s\n", apiURL)
		if token != "" {
			fmt.Printf("API Token:   [configured]\n")
		} else {
			fmt.Printf("API Token:   [not set - run '%s login']\n", binaryName)
		}
		fmt.Printf("Config file: %s\n", configPath)
	},
}

func init() {
	rootCmd.AddCommand(configCmd)
	configCmd.AddCommand(setURLCmd)
	configCmd.AddCommand(viewCmd)
	setURLCmd.Example = "  " + binaryName + " config set-url http://localhost:3333/api/v1\n" +
		"  " + binaryName + " config set-url https://journal.my-domain.com/api/v1"
	viewCmd.Example = "  " + binaryName + " config view"
}

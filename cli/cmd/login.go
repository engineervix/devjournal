package cmd

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"

	"github.com/go-resty/resty/v2"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"golang.org/x/term"
)

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Authenticate with your DevJournal instance",
	Run: func(cmd *cobra.Command, args []string) {
		// Prompt for server URL, allowing the user to change it from the current value
		currentURL := viper.GetString("api_url")
		fmt.Printf("Server URL [%s]: ", currentURL)
		reader := bufio.NewReader(os.Stdin)
		inputURL, err := reader.ReadString('\n')
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading URL: %v\n", err)
			return
		}
		inputURL = strings.TrimSpace(inputURL)
		if inputURL != "" {
			viper.Set("api_url", inputURL)
		}

		fmt.Print("Enter your API Token: ")
		byteToken, err := term.ReadPassword(int(syscall.Stdin))
		if err != nil {
			fmt.Fprintf(os.Stderr, "\nError reading token: %v\n", err)
			return
		}
		token := strings.TrimSpace(string(byteToken))
		fmt.Println()

		if token == "" {
			fmt.Fprintln(os.Stderr, "Error: Token cannot be empty")
			return
		}

		// Validate token by making a test API request
		fmt.Print("Validating token... ")
		apiURL := viper.GetString("api_url")
		client := resty.New()

		// Validate the token using the /me endpoint
		resp, err := client.R().
			SetAuthToken(token).
			SetHeader("Content-Type", "application/json").
			Get(apiURL + "/me")

		if err != nil {
			fmt.Fprintf(os.Stderr, "\n✗ Error connecting to API: %v\n", err)
			fmt.Fprintln(os.Stderr, "Please check your network connection and API URL.")
			fmt.Fprintf(os.Stderr, "Current API URL: %s\n", apiURL)
			fmt.Fprintf(os.Stderr, "You can change it with: %s config set-url <URL>\n", binaryName)
			return
		}

		if resp.StatusCode() == 401 {
			fmt.Fprintln(os.Stderr, "\n✗ Invalid token. Please check your API token and try again.")
			return
		}

		if resp.IsError() {
			fmt.Fprintf(os.Stderr, "\n✗ API error (%s): %s\n", resp.Status(), resp.String())
			return
		}

		fmt.Println("✓")

		viper.Set("api_token", token)

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

		fmt.Println("✓ Successfully logged in!")
		fmt.Printf("Token saved to %s\n", configPath)
	},
}

func init() {
	rootCmd.AddCommand(loginCmd)
	loginCmd.Example = "  " + binaryName + " login"
}

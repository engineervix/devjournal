package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var cfgFile string

var rootCmd = &cobra.Command{
	Use:   "devlog-client",
	Short: "A CLI for DevJournal",
	Long: `DevLog Client is a CLI tool to interact with your DevJournal instance.
It allows you to create logs, snippets, and TILs directly from your terminal.`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.config/devlog-client/config.json)")
}

func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		configDir, err := os.UserConfigDir()
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}

		devlogConfigDir := filepath.Join(configDir, "devlog-client")
		if _, err := os.Stat(devlogConfigDir); os.IsNotExist(err) {
			os.MkdirAll(devlogConfigDir, 0700)
		}

		viper.AddConfigPath(devlogConfigDir)
		viper.SetConfigType("json")
		viper.SetConfigName("config")
	}

	viper.SetDefault("api_url", "http://localhost:3333/api/v1")

	if err := viper.ReadInConfig(); err == nil {
		// Config loaded
	}
}

package cmd

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/spf13/viper"
)

func TestConfigSetURL(t *testing.T) {
	tests := []struct {
		name        string
		url         string
		wantErr     bool
		wantContain string
	}{
		{
			name:        "valid HTTPS URL",
			url:         "https://journal.example.com/api/v1",
			wantErr:     false,
			wantContain: "API URL set to: https://journal.example.com/api/v1",
		},
		{
			name:        "valid HTTP localhost",
			url:         "http://localhost:3333/api/v1",
			wantErr:     false,
			wantContain: "API URL set to: http://localhost:3333/api/v1",
		},
		{
			name:        "valid with port",
			url:         "https://journal.example.com:8080/api/v1",
			wantErr:     false,
			wantContain: "API URL set to: https://journal.example.com:8080/api/v1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup test config
			configDir := setupTestConfig(t)

			// Capture output
			buf := new(bytes.Buffer)
			originalStdout := os.Stdout
			r, w, _ := os.Pipe()
			os.Stdout = w
			t.Cleanup(func() { os.Stdout = originalStdout })

			// Run command
			setURLCmd.Run(setURLCmd, []string{tt.url})

			w.Close()
			buf.ReadFrom(r)
			output := buf.String()

			// Check output
			if !strings.Contains(output, tt.wantContain) {
				t.Errorf("Expected output to contain %q, got %q", tt.wantContain, output)
			}

			// Verify config was saved
			if viper.GetString("api_url") != tt.url {
				t.Errorf("Expected api_url to be %q, got %q", tt.url, viper.GetString("api_url"))
			}

			// Verify config file exists
			configPath := filepath.Join(configDir, "config.json")
			if _, err := os.Stat(configPath); os.IsNotExist(err) {
				t.Error("Config file was not created")
			}
		})
	}
}

func TestConfigSetURLEmpty(t *testing.T) {
	// This test verifies that empty URLs are rejected
	// Setup test config
	setupTestConfig(t)

	// Capture output
	buf := new(bytes.Buffer)
	originalStderr := os.Stderr
	r, w, _ := os.Pipe()
	os.Stderr = w
	t.Cleanup(func() { os.Stderr = originalStderr })

	// Run with empty URL
	setURLCmd.Run(setURLCmd, []string{""})

	w.Close()
	buf.ReadFrom(r)
	output := buf.String()

	if !strings.Contains(output, "URL cannot be empty") {
		t.Errorf("Expected error message about empty URL, got %q", output)
	}
}

func TestConfigView(t *testing.T) {
	// Setup test config
	configDir := setupTestConfig(t)

	// Set test values
	viper.Set("api_url", "https://test.example.com/api/v1")
	viper.Set("api_token", "test-token-123")

	// Save config
	configPath := filepath.Join(configDir, "config.json")
	viper.WriteConfigAs(configPath)

	// Capture output
	buf := new(bytes.Buffer)
	originalStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w
	t.Cleanup(func() { os.Stdout = originalStdout })

	// Run view command
	viewCmd.Run(viewCmd, []string{})

	w.Close()
	buf.ReadFrom(r)
	output := buf.String()

	// Check that output contains expected values
	if !strings.Contains(output, "https://test.example.com/api/v1") {
		t.Error("Output should contain API URL")
	}
	if !strings.Contains(output, "[configured]") {
		t.Error("Output should indicate token is configured")
	}
	if !strings.Contains(output, "Current Configuration") {
		t.Error("Output should contain header")
	}
}

func TestConfigViewNoToken(t *testing.T) {
	// Setup test config without token
	configDir := setupTestConfig(t)

	viper.Set("api_url", "https://test.example.com/api/v1")
	// Don't set token

	configPath := filepath.Join(configDir, "config.json")
	viper.WriteConfigAs(configPath)

	originalConfigDir := os.Getenv("XDG_CONFIG_HOME")
	parentDir := filepath.Dir(configDir)
	os.Setenv("XDG_CONFIG_HOME", parentDir)
	t.Cleanup(func() {
		if originalConfigDir != "" {
			os.Setenv("XDG_CONFIG_HOME", originalConfigDir)
		} else {
			os.Unsetenv("XDG_CONFIG_HOME")
		}
	})

	// Capture output
	buf := new(bytes.Buffer)
	originalStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w
	t.Cleanup(func() { os.Stdout = originalStdout })

	viewCmd.Run(viewCmd, []string{})

	w.Close()
	buf.ReadFrom(r)
	output := buf.String()

	if !strings.Contains(output, "[not set - run 'devlog-client login']") {
		t.Error("Output should indicate token is not set")
	}
}

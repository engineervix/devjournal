package cmd

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/spf13/viper"
)

// setupTestConfig creates a temporary config directory for testing
func setupTestConfig(t *testing.T) string {
	t.Helper()

	tmpDir := t.TempDir()
	
	// Mock environment variables for os.UserConfigDir()
	originalXDG := os.Getenv("XDG_CONFIG_HOME")
	originalHome := os.Getenv("HOME")
	originalAppData := os.Getenv("AppData")
	
	os.Setenv("XDG_CONFIG_HOME", tmpDir)
	os.Setenv("HOME", tmpDir)
	os.Setenv("AppData", tmpDir)
	
	t.Cleanup(func() {
		if originalXDG != "" { os.Setenv("XDG_CONFIG_HOME", originalXDG) } else { os.Unsetenv("XDG_CONFIG_HOME") }
		if originalHome != "" { os.Setenv("HOME", originalHome) } else { os.Unsetenv("HOME") }
		if originalAppData != "" { os.Setenv("AppData", originalAppData) } else { os.Unsetenv("AppData") }
	})

	userConfigDir, _ := os.UserConfigDir()
	configDir := filepath.Join(userConfigDir, "devlog-client")
	err := os.MkdirAll(configDir, 0700)
	if err != nil {
		t.Fatalf("Failed to create test config dir: %v", err)
	}

	// Reset viper for each test
	viper.Reset()
	viper.AddConfigPath(configDir)
	viper.SetConfigType("json")
	viper.SetConfigName("config")

	return configDir
}

// mockAPIServer creates a mock HTTP server for testing API calls
func mockAPIServer(t *testing.T, handler http.HandlerFunc) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	return server
}

// mockSuccessResponse returns a standard success API response
func mockSuccessResponse(message string, data interface{}) []byte {
	resp := map[string]interface{}{
		"success": true,
		"message": message,
		"data":    data,
	}
	body, _ := json.Marshal(resp)
	return body
}

// mockErrorResponse returns a standard error API response
func mockErrorResponse(message string) []byte {
	resp := map[string]interface{}{
		"success": false,
		"message": message,
	}
	body, _ := json.Marshal(resp)
	return body
}

// mockValidationErrorResponse returns a validation error response
func mockValidationErrorResponse(errors []map[string]string) []byte {
	resp := map[string]interface{}{
		"errors": errors,
	}
	body, _ := json.Marshal(resp)
	return body
}

// setTestConfig sets up viper with test values
func setTestConfig(apiURL, token string) {
	viper.Set("api_url", apiURL)
	viper.Set("api_token", token)
}

// mockEntryData returns mock entry data for testing
func mockEntryData() map[string]interface{} {
	return map[string]interface{}{
		"id":              "test-uuid-123",
		"userId":          1,
		"entryType":       "daily",
		"title":           "Test Entry",
		"contentMarkdown": "Test content",
		"contentHtml":     "<p>Test content</p>",
		"contentPlain":    "Test content",
		"tags": []map[string]interface{}{
			{
				"id":   1,
				"name": "test",
				"slug": "test",
			},
		},
		"createdAt": "2026-02-12T10:00:00Z",
		"updatedAt": "2026-02-12T10:00:00Z",
	}
}

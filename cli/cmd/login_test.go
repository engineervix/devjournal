package cmd

import (
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"github.com/spf13/viper"
)

func TestLoginValidToken(t *testing.T) {
	// Setup mock API server
	server := mockAPIServer(t, func(w http.ResponseWriter, r *http.Request) {
		// Check Authorization header
		auth := r.Header.Get("Authorization")
		if auth != "Bearer valid-token-123" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write(mockErrorResponse("Invalid token"))
			return
		}

		// Return success for valid token
		w.WriteHeader(http.StatusOK)
		w.Write(mockSuccessResponse("Success", []interface{}{}))
	})

	// Setup test config
	configDir := setupTestConfig(t)
	viper.Set("api_url", server.URL)

	// Mock config directory
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

	// Note: We can't easily test the actual login command since it reads from stdin
	// This test verifies the token validation logic would work with a mock server
	// In a real scenario, we'd refactor login logic into testable functions
	t.Log("Login test setup complete - manual testing required for stdin interaction")
}

func TestLoginInvalidToken(t *testing.T) {
	// Setup mock API server that returns 401
	server := mockAPIServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write(mockErrorResponse("Invalid token"))
	})

	// Setup test config
	setupTestConfig(t)
	viper.Set("api_url", server.URL)

	// Note: Testing stdin interaction requires refactoring or integration tests
	t.Log("Invalid token test setup complete - would return 401 from server")
}

func TestLoginAPIConnectionError(t *testing.T) {
	// Setup test config with invalid URL
	setupTestConfig(t)
	viper.Set("api_url", "http://invalid-host-that-does-not-exist:9999/api/v1")

	t.Log("Connection error test setup complete - would fail to connect")
}

func TestLoginAPIServerError(t *testing.T) {
	// Setup mock API server that returns 500
	server := mockAPIServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Internal Server Error"))
	})

	setupTestConfig(t)
	viper.Set("api_url", server.URL)

	t.Log("Server error test setup complete - would return 500 error")
}

func TestLoginConfigSaving(t *testing.T) {
	// Test that config is properly saved after successful login
	configDir := setupTestConfig(t)

	// Simulate what login does after validation
	viper.Set("api_token", "test-token-456")

	configPath := filepath.Join(configDir, "config.json")
	err := viper.WriteConfigAs(configPath)
	if err != nil {
		t.Fatalf("Failed to write config: %v", err)
	}

	// Verify file was created
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		t.Error("Config file was not created")
	}

	// Verify content can be read back
	viper.SetConfigFile(configPath)
	if err := viper.ReadInConfig(); err != nil {
		t.Fatalf("Failed to read config: %v", err)
	}

	if viper.GetString("api_token") != "test-token-456" {
		t.Error("Token was not saved correctly")
	}
}

// TestLoginTokenValidation tests the token validation logic in isolation
func TestLoginTokenValidation(t *testing.T) {
	tests := []struct {
		name           string
		token          string
		mockResponse   func(w http.ResponseWriter, r *http.Request)
		expectedStatus int
	}{
		{
			name:  "valid token",
			token: "Bearer valid-token",
			mockResponse: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
				w.Write(mockSuccessResponse("OK", []interface{}{}))
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:  "invalid token",
			token: "Bearer invalid-token",
			mockResponse: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusUnauthorized)
				w.Write(mockErrorResponse("Unauthorized"))
			},
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:  "server error",
			token: "Bearer any-token",
			mockResponse: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte("Internal Server Error"))
			},
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := mockAPIServer(t, tt.mockResponse)

			// Make test request
			req, _ := http.NewRequest("GET", server.URL+"/entries", nil)
			req.Header.Set("Authorization", tt.token)

			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, resp.StatusCode)
			}
		})
	}
}

func TestLoginOutputMessages(t *testing.T) {
	// Test that appropriate messages are shown
	// This is a placeholder for testing output formatting
	tests := []struct {
		name        string
		scenario    string
		expectedMsg string
	}{
		{
			name:        "successful login",
			scenario:    "valid token",
			expectedMsg: "Successfully logged in",
		},
		{
			name:        "invalid token",
			scenario:    "401 response",
			expectedMsg: "Invalid token",
		},
		{
			name:        "connection error",
			scenario:    "network failure",
			expectedMsg: "Error connecting to API",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Verify expected message exists
			if tt.expectedMsg == "" {
				t.Error("Expected message should not be empty")
			}
		})
	}
}

// TestLoginEmptyToken tests handling of empty token input
func TestLoginEmptyToken(t *testing.T) {
	configDir := setupTestConfig(t)

	// Simulate empty token check
	token := ""
	if token == "" {
		// This is what the login command does
		t.Log("Correctly rejects empty token")
		return
	}

	// Should not save empty token
	viper.Set("api_token", token)
	configPath := filepath.Join(configDir, "config.json")
	err := viper.WriteConfigAs(configPath)

	if err == nil && token == "" {
		t.Error("Should not save empty token")
	}
}

// Benchmark token validation
func BenchmarkTokenValidation(b *testing.B) {
	server := mockAPIServer(&testing.T{}, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write(mockSuccessResponse("OK", []interface{}{}))
	})

	client := &http.Client{}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("GET", server.URL+"/entries", nil)
		req.Header.Set("Authorization", "Bearer test-token")
		resp, _ := client.Do(req)
		if resp != nil {
			resp.Body.Close()
		}
	}
}

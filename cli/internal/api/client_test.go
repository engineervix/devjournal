package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNewClient(t *testing.T) {
	client := NewClient("http://example.com", "token")
	if client == nil {
		t.Fatal("Expected client to be non-nil")
	}
	if client.apiURL != "http://example.com" {
		t.Errorf("Expected URL 'http://example.com', got '%s'", client.apiURL)
	}
}

func TestGetEntries(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/entries" {
			t.Errorf("Expected path /entries, got %s", r.URL.Path)
		}
		if r.Header.Get("Authorization") != "Bearer token" {
			t.Errorf("Expected Authorization header, got %s", r.Header.Get("Authorization"))
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"success": true,
			"data": {
				"data": [
					{"id": "1", "title": "Test Entry", "contentMarkdown": "Content"}
				]
			}
		}`))
	}))
	defer server.Close()

	client := NewClient(server.URL, "token")
	entries, err := client.GetEntries(GetEntriesOptions{})
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(entries) != 1 {
		t.Errorf("Expected 1 entry, got %d", len(entries))
	}
	if entries[0].Title != "Test Entry" {
		t.Errorf("Expected title 'Test Entry', got '%s'", entries[0].Title)
	}
}

func TestGetEntry(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/entries/123" {
			t.Errorf("Expected path /entries/123, got %s", r.URL.Path)
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"success": true,
			"data": {"id": "123", "title": "Test Entry"}
		}`))
	}))
	defer server.Close()

	client := NewClient(server.URL, "token")
	entry, err := client.GetEntry("123")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if entry.ID != "123" {
		t.Errorf("Expected ID '123', got '%s'", entry.ID)
	}
}

func TestCreateEntry(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("Expected method POST, got %s", r.Method)
		}

		var payload CreateEntryPayload
		json.NewDecoder(r.Body).Decode(&payload)
		if payload.Title != "New Entry" {
			t.Errorf("Expected title 'New Entry', got '%s'", payload.Title)
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{
			"success": true,
			"data": {"id": "1", "title": "New Entry"}
		}`))
	}))
	defer server.Close()

	client := NewClient(server.URL, "token")
	entry, err := client.CreateEntry(CreateEntryPayload{Title: "New Entry"})
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if entry.Title != "New Entry" {
		t.Errorf("Expected title 'New Entry', got '%s'", entry.Title)
	}
}

func TestUpdateEntry(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "PUT" {
			t.Errorf("Expected method PUT, got %s", r.Method)
		}
		if r.URL.Path != "/entries/1" {
			t.Errorf("Expected path /entries/1, got %s", r.URL.Path)
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"success": true,
			"data": {"id": "1", "title": "Updated Entry"}
		}`))
	}))
	defer server.Close()

	client := NewClient(server.URL, "token")
	entry, err := client.UpdateEntry("1", UpdateEntryPayload{Title: "Updated Entry"})
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if entry.Title != "Updated Entry" {
		t.Errorf("Expected title 'Updated Entry', got '%s'", entry.Title)
	}
}

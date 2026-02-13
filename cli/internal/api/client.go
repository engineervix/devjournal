package api

import (
	"encoding/json"
	"fmt"

	"github.com/go-resty/resty/v2"
)

// APIError represents a standard error response from the API
type APIError struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// ValidationError represents a validation error response
type ValidationError struct {
	Errors []struct {
		Field   string `json:"field"`
		Message string `json:"message"`
	} `json:"errors"`
}

// APISuccessResponse represents a standard success response
type APISuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// Entry represents a journal entry
type Entry struct {
	ID              string `json:"id"`
	EntryType       string `json:"entryType"`
	Title           string `json:"title,omitempty"`
	ContentMarkdown string `json:"contentMarkdown"`
	ContentHTML     string `json:"contentHtml,omitempty"`
	Tags            []Tag  `json:"tags,omitempty"`
	CreatedAt       string `json:"createdAt"`
	UpdatedAt       string `json:"updatedAt"`
}

// Tag represents a tag
type Tag struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// Client wraps the resty client
type Client struct {
	restyClient *resty.Client
	apiURL      string
}

// NewClient creates a new API client
func NewClient(apiURL, token string) *Client {
	c := resty.New()
	c.SetAuthToken(token)

	return &Client{
		restyClient: c,
		apiURL:      apiURL,
	}
}

// CreateEntryPayload represents the payload for creating an entry
type CreateEntryPayload struct {
	EntryType       string   `json:"entryType"`
	Title           string   `json:"title,omitempty"`
	ContentMarkdown string   `json:"contentMarkdown"`
	Tags            []string `json:"tags,omitempty"`
}

// CreateEntry creates a new entry
func (c *Client) CreateEntry(payload CreateEntryPayload) (*Entry, error) {
	resp, err := c.restyClient.R().
		SetBody(payload).
		Post(c.apiURL + "/entries")

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.IsError() {
		return nil, c.handleError(resp)
	}

	var successResp struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Data    Entry  `json:"data"`
	}

	if err := json.Unmarshal(resp.Body(), &successResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &successResp.Data, nil
}

// GetEntriesOptions filters for listing entries
type GetEntriesOptions struct {
	Page    int
	PerPage int
	Type    string
	Tag     string
	JSON    bool // Helper for CLI output formatting, not sent to API
}

// GetEntries returns a list of entries
func (c *Client) GetEntries(opts GetEntriesOptions) ([]Entry, error) {
	req := c.restyClient.R()

	if opts.Page > 0 {
		req.SetQueryParam("page", fmt.Sprintf("%d", opts.Page))
	}
	if opts.PerPage > 0 {
		req.SetQueryParam("perPage", fmt.Sprintf("%d", opts.PerPage))
	}
	if opts.Type != "" {
		req.SetQueryParam("type", opts.Type)
	}
	if opts.Tag != "" {
		req.SetQueryParam("tag", opts.Tag)
	}

	resp, err := req.Get(c.apiURL + "/entries")
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.IsError() {
		return nil, c.handleError(resp)
	}

	var successResp struct {
		Success bool `json:"success"`
		Data    struct {
			Meta struct {
				Total       int `json:"total"`
				PerPage     int `json:"perPage"`
				CurrentPage int `json:"currentPage"`
				LastPage    int `json:"lastPage"`
			} `json:"meta"`
			Data []Entry `json:"data"`
		} `json:"data"`
	}

	// Handle both paginated and non-paginated responses structure if needed,
	// but based on typical AdonisJS pagination, it returns meta + data.
	// Let's assume the controller returns the paginator object directly in `data`.
	// Checking `entries_controller.ts`: `return response.json({ success: true, data: entries })`
	// usage of `query.paginate` in service usually returns serialization with meta.

	if err := json.Unmarshal(resp.Body(), &successResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return successResp.Data.Data, nil
}

// UpdateEntryPayload represents the payload for updating an entry
type UpdateEntryPayload struct {
	EntryType       string   `json:"entryType,omitempty"`
	Title           string   `json:"title,omitempty"`
	ContentMarkdown string   `json:"contentMarkdown,omitempty"`
	Tags            []string `json:"tags,omitempty"`
}

// UpdateEntry updates an existing entry
func (c *Client) UpdateEntry(id string, payload UpdateEntryPayload) (*Entry, error) {
	resp, err := c.restyClient.R().
		SetBody(payload).
		Put(c.apiURL + "/entries/" + id)

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.IsError() {
		return nil, c.handleError(resp)
	}

	var successResp struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Data    Entry  `json:"data"`
	}

	if err := json.Unmarshal(resp.Body(), &successResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &successResp.Data, nil
}

// GetEntry fetches a single entry
func (c *Client) GetEntry(id string) (*Entry, error) {
	resp, err := c.restyClient.R().Get(c.apiURL + "/entries/" + id)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.IsError() {
		return nil, c.handleError(resp)
	}

	// Check if the response is wrapped

	// Check if the response is wrapped
	var successResp struct {
		Success bool  `json:"success"`
		Data    Entry `json:"data"`
	}

	if err := json.Unmarshal(resp.Body(), &successResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &successResp.Data, nil
}

func (c *Client) handleError(resp *resty.Response) error {
	// Try to parse as validation error (422)
	if resp.StatusCode() == 422 {
		var validationErr ValidationError
		if err := json.Unmarshal(resp.Body(), &validationErr); err == nil && len(validationErr.Errors) > 0 {
			errMsg := "validation errors:\n"
			for _, e := range validationErr.Errors {
				errMsg += fmt.Sprintf("  • %s: %s\n", e.Field, e.Message)
			}
			return fmt.Errorf("%s", errMsg)
		}
	}

	// Try to parse as standard API error
	var apiErr APIError
	if err := json.Unmarshal(resp.Body(), &apiErr); err == nil && apiErr.Message != "" {
		return fmt.Errorf("%s", apiErr.Message)
	}

	return fmt.Errorf("API error (%s): %s", resp.Status(), resp.String())
}

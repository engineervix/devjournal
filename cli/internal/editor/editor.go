package editor

import (
	"fmt"
	"os"
	"os/exec"
)

// OpenEditor opens the default editor with the given content and returns the updated content.
// extension is the file extension to use for the temporary file (e.g. ".md").
func OpenEditor(initialContent string, extension string) (string, error) {
	editor := os.Getenv("EDITOR")
	if editor == "" {
		editor = "vim"
	}

	tmpFile, err := os.CreateTemp("", "devlog-*"+extension)
	if err != nil {
		return "", fmt.Errorf("error creating temp file: %w", err)
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(initialContent); err != nil {
		return "", fmt.Errorf("error writing initial content: %w", err)
	}
	tmpFile.Close()

	cmdExec := exec.Command(editor, tmpFile.Name())
	cmdExec.Stdin = os.Stdin
	cmdExec.Stdout = os.Stdout
	cmdExec.Stderr = os.Stderr

	if err := cmdExec.Run(); err != nil {
		return "", fmt.Errorf("error opening editor: %w", err)
	}

	contentBytes, err := os.ReadFile(tmpFile.Name())
	if err != nil {
		return "", fmt.Errorf("error reading content: %w", err)
	}

	return string(contentBytes), nil
}

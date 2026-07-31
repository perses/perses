package file

import (
	"os"
	"path/filepath"
	"testing"
)

func TestUnmarshalEntitiesFromFileYAMLMultiDocument(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	filePath := filepath.Join(dir, "resources.yaml")

	content := `kind: Project
metadata:
  name: first-project
---
kind: Project
metadata:
  name: second-project
`

	if err := os.WriteFile(filePath, []byte(content), 0o600); err != nil {
		t.Fatalf("unable to write test file: %v", err)
	}

	entities, err := UnmarshalEntitiesFromFile(filePath)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if len(entities) != 2 {
		t.Fatalf("expected 2 entities, got %d", len(entities))
	}

	if entities[0].GetKind() != "Project" {
		t.Fatalf("expected first kind to be Project, got %q", entities[0].GetKind())
	}

	if entities[1].GetKind() != "Project" {
		t.Fatalf("expected second kind to be Project, got %q", entities[1].GetKind())
	}
}


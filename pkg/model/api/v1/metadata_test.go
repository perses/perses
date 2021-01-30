package v1

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestKind_validateError(t *testing.T) {
	testSuites := []struct {
		title       string
		kind        Kind
		resultError error
	}{
		{
			title:       "empty kind",
			kind:        "",
			resultError: fmt.Errorf("kind cannot be empty"),
		},
		{
			title:       "unknown kind",
			kind:        "unknown",
			resultError: fmt.Errorf("unknown kind 'unknown' used"),
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.resultError, (&test.kind).validate())
		})
	}
}

func TestKind_validate(t *testing.T) {
	testSuites := []struct {
		title string
		kind  Kind
	}{
		{
			title: "project",
			kind:  KindProject,
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			assert.NoError(t, (&test.kind).validate())
		})
	}
}

func TestMetadata_validateError(t *testing.T) {
	testSuites := []struct {
		title       string
		metadata    Metadata
		resultError error
	}{
		{
			title: "empty name",
			metadata: Metadata{
				Kind: KindProject,
			},
			resultError: fmt.Errorf("metadata.name cannot be empty"),
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.resultError, (&test.metadata).validate())
		})
	}
}

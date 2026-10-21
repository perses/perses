// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package docsnav

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/perses/common/set"
	"github.com/stretchr/testify/assert"
)

func TestParse(t *testing.T) {
	entries, err := Parse([]byte(`
- overview.md
- Getting started: getting-started.md
- Concepts:
    - Dashboard: concepts/dashboard.md
- Helm: helm-charts:installation.md
- Plugins: /docs/plugins/
- Demo: https://demo.perses.dev
`))
	assert.NoError(t, err)
	assert.Equal(t, []Entry{
		{Kind: KindPage, Target: "overview.md", Line: 2},
		{Kind: KindPage, Title: "Getting started", Target: "getting-started.md", Line: 3},
		{Kind: KindSection, Title: "Concepts", Line: 4, Children: []Entry{
			{Kind: KindPage, Title: "Dashboard", Target: "concepts/dashboard.md", Line: 5},
		}},
		{Kind: KindCrossSourcePage, Title: "Helm", Target: "helm-charts:installation.md", Line: 6},
		{Kind: KindLink, Title: "Plugins", Target: "/docs/plugins/", Line: 7},
		{Kind: KindLink, Title: "Demo", Target: "https://demo.perses.dev", Line: 8},
	}, entries)
}

func TestParseInvalid(t *testing.T) {
	testSuite := []struct {
		title string
		nav   string
		err   string
	}{
		{title: "empty", nav: "", err: "the navigation is empty"},
		{title: "not a list", nav: "title: page.md", err: "line 1: expected a list of entries"},
		{title: "several keys", nav: "- a: a.md\n  b: b.md", err: "line 1: an entry must have exactly one key, got 2"},
		{title: "empty section", nav: "- Section: []", err: `line 1: the section "Section" is empty`},
		{title: "empty target", nav: `- Page: ""`, err: "line 1: empty target"},
		{title: "object as target", nav: "- Page:\n    a: b", err: `line 2: the entry "Page" must be a page, a link or a list of entries`},
		{title: "nested error", nav: "- Section:\n    - a: a.md\n      b: b.md", err: "line 2: an entry must have exactly one key, got 2"},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			_, err := Parse([]byte(test.nav))
			assert.EqualError(t, err, test.err)
		})
	}
}

func writeDocs(t *testing.T, files map[string]string) string {
	t.Helper()
	dir := t.TempDir()
	for name, content := range files {
		file := filepath.Join(dir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(file), 0750); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(file, []byte(content), 0600); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

func TestCheck(t *testing.T) {
	pages := map[string]string{
		"overview.md":           "# Overview",
		"concepts/dashboard.md": "# Dashboard",
		"api/README.md":         "# API",
		// Hidden files are not published, they don't need to be referenced.
		".github/template.md": "# Template",
		"images/logo.png":     "",
	}
	testSuite := []struct {
		title    string
		nav      string
		extra    map[string]string
		ignored  []string
		errors   []string
		warnings []string
	}{
		{
			title: "valid navigation",
			nav: `
- overview.md
- Concepts:
    - Dashboard: ./concepts/dashboard.md
- API: api/README.md
- Helm: helm-charts:installation.md
- Demo: https://demo.perses.dev
`,
		},
		{
			title: "page not referenced",
			nav:   "- overview.md\n- api/README.md",
			errors: []string{
				"{dir}/concepts/dashboard.md: the page is not referenced in {nav}",
			},
		},
		{
			title:   "page not referenced but ignored",
			nav:     "- overview.md",
			ignored: []string{"concepts/*.md", "api/*"},
		},
		{
			title: "page not found",
			nav:   "- overview.md\n- concepts/dashboard.md\n- api/README.md\n- Missing: concepts/missing.md",
			errors: []string{
				`{nav}:4: the page "concepts/missing.md" doesn't exist`,
			},
		},
		{
			title: "page outside of the documentation",
			nav:   "- overview.md\n- concepts/dashboard.md\n- api/README.md\n- ../README.md",
			errors: []string{
				`{nav}:4: the page "../README.md" is outside of the documentation`,
			},
		},
		{
			title: "page referenced twice",
			nav:   "- overview.md\n- concepts/dashboard.md\n- api/README.md\n- Again: overview.md",
			warnings: []string{
				`{nav}:4: the page "overview.md" is already referenced at line 1`,
			},
		},
		{
			title: "invalid navigation",
			nav:   "- a: a.md\n  b: b.md",
			errors: []string{
				"{nav}: line 1: an entry must have exactly one key, got 2",
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			files := map[string]string{NavFile: test.nav}
			for name, content := range pages {
				files[name] = content
			}
			dir := writeDocs(t, files)
			// {nav} is the path of the navigation file and {dir}/<page> the path of a page, using the separator of the
			// OS. The paths of the pages written in the navigation are reported as is.
			replace := func(messages []string) []string {
				var result []string
				for _, message := range messages {
					message = strings.ReplaceAll(message, "{nav}", filepath.Join(dir, NavFile))
					if rest, ok := strings.CutPrefix(message, "{dir}/"); ok {
						page, suffix, _ := strings.Cut(rest, ":")
						message = filepath.Join(dir, filepath.FromSlash(page)) + ":" + suffix
					}
					result = append(result, message)
				}
				return result
			}
			result, err := Check(dir, set.New(test.ignored...))
			assert.NoError(t, err)
			assert.Equal(t, replace(test.errors), result.Errors)
			assert.Equal(t, replace(test.warnings), result.Warnings)
			assert.Equal(t, 3, result.Pages)
		})
	}
}

func TestCheckWithoutNavigation(t *testing.T) {
	dir := writeDocs(t, map[string]string{"overview.md": "# Overview"})
	_, err := Check(dir, set.New[string]())
	assert.ErrorContains(t, err, "unable to read the navigation")
}

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

// Package docsnav validates the file nav.yaml describing the navigation of the documentation published on
// https://perses.dev. The website reads this file for each published version of the documentation.
//
// The syntax is close to the nav section of mkdocs:
//
//	# docs/nav.yaml
//	- overview.md                          # page, the title is the first h1 of the page
//	- Getting started: getting-started.md  # page with an explicit title
//	- Concepts:                            # section
//	    - Dashboard: concepts/dashboard.md
//	- Helm: helm-charts:installation.md    # page of another documentation of the website
//	- Plugins: /docs/plugins/              # link to another page of the website
//	- Demo: https://demo.perses.dev        # external link
//
// The validation checks that the file is well-formed, that every page it references exists and that every page of the
// documentation is referenced. These rules are stricter than the ones of the website, so a navigation accepted by
// this package is always accepted by the website.
package docsnav

import (
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/perses/common/set"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

const (
	// defaultDocsDir is the directory containing the documentation, relative to the root of the repository.
	defaultDocsDir = "docs"
	// navFile is the name of the navigation file, at the root of the documentation directory.
	navFile = "nav.yaml"
)

var (
	urlRegexp         = regexp.MustCompile(`^[a-zA-Z][a-zA-Z0-9+.-]*://`)
	crossSourceRegexp = regexp.MustCompile(`^([a-z0-9-]+):(.+)$`)
)

// entryKind is the kind of entry of the navigation.
type entryKind string

const (
	// kindPage is a page of the documentation, referenced by its path relative to the documentation directory.
	kindPage entryKind = "page"
	// kindCrossSourcePage is a page of another documentation of the website, like `plugins:prometheus/README.md`.
	// It can't be validated here, as the other documentation lives in another repository.
	kindCrossSourcePage entryKind = "cross-source page"
	// kindLink is an external link or a link to another page of the website.
	kindLink entryKind = "link"
	// kindSection groups other entries.
	kindSection entryKind = "section"
)

// navEntry is an entry of the navigation.
type navEntry struct {
	kind  entryKind
	title string
	// target is the path of the page, the reference of the page of another documentation or the URL of the link.
	target   string
	children []navEntry
	// line is the line of the entry in the navigation file.
	line int
}

func parseTarget(title string, value *yaml.Node) (navEntry, error) {
	target := strings.TrimSpace(value.Value)
	entry := navEntry{title: title, target: target, line: value.Line}
	switch {
	case target == "":
		return entry, fmt.Errorf("line %d: empty target", value.Line)
	case urlRegexp.MatchString(target), strings.HasPrefix(target, "/"), strings.HasPrefix(target, "mailto:"):
		entry.kind = kindLink
	case crossSourceRegexp.MatchString(target):
		entry.kind = kindCrossSourcePage
	default:
		entry.kind = kindPage
	}
	return entry, nil
}

func parseEntries(node *yaml.Node) ([]navEntry, error) {
	if node.Kind != yaml.SequenceNode {
		return nil, fmt.Errorf("line %d: expected a list of entries", node.Line)
	}
	var entries []navEntry
	var errs []error
	for _, item := range node.Content {
		entry, err := parseEntry(item)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		entries = append(entries, entry)
	}
	return entries, errors.Join(errs...)
}

func parseEntry(node *yaml.Node) (navEntry, error) {
	switch node.Kind {
	case yaml.ScalarNode:
		return parseTarget("", node)
	case yaml.MappingNode:
		if len(node.Content) != 2 {
			return navEntry{}, fmt.Errorf("line %d: an entry must have exactly one key, got %d", node.Line, len(node.Content)/2)
		}
		key, value := node.Content[0], node.Content[1]
		title := strings.TrimSpace(key.Value)
		if key.Kind != yaml.ScalarNode || title == "" {
			return navEntry{}, fmt.Errorf("line %d: the title of an entry must be a non-empty string", key.Line)
		}
		switch value.Kind {
		case yaml.ScalarNode:
			return parseTarget(title, value)
		case yaml.SequenceNode:
			children, err := parseEntries(value)
			if err != nil {
				return navEntry{}, err
			}
			if len(children) == 0 {
				return navEntry{}, fmt.Errorf("line %d: the section %q is empty", key.Line, title)
			}
			return navEntry{kind: kindSection, title: title, children: children, line: key.Line}, nil
		default:
			return navEntry{}, fmt.Errorf("line %d: the entry %q must be a page, a link or a list of entries", value.Line, title)
		}
	default:
		return navEntry{}, fmt.Errorf("line %d: expected a page, a link or a \"title: value\" entry", node.Line)
	}
}

// parse parses the content of a navigation file.
func parse(data []byte) ([]navEntry, error) {
	var document yaml.Node
	if err := yaml.Unmarshal(data, &document); err != nil {
		return nil, err
	}
	if len(document.Content) == 0 {
		return nil, errors.New("the navigation is empty")
	}
	return parseEntries(document.Content[0])
}

// checkResult is the result of the validation of the navigation.
type checkResult struct {
	errors   []string
	warnings []string
	// pages is the number of pages of the documentation.
	pages int
}

func listPages(docsDir string) ([]string, error) {
	var pages []string
	err := filepath.WalkDir(docsDir, func(p string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		// Same rules as the website: the hidden files and directories are not published.
		if p != docsDir && (strings.HasPrefix(entry.Name(), ".") || entry.Name() == "node_modules") {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if !entry.IsDir() && strings.EqualFold(filepath.Ext(entry.Name()), ".md") {
			rel, relErr := filepath.Rel(docsDir, p)
			if relErr != nil {
				return relErr
			}
			pages = append(pages, filepath.ToSlash(rel))
		}
		return nil
	})
	sort.Strings(pages)
	return pages, err
}

func isIgnored(page string, patterns set.Set[string]) (bool, error) {
	for pattern := range patterns {
		matched, err := path.Match(pattern, page)
		if err != nil {
			return false, fmt.Errorf("invalid ignore pattern %q: %w", pattern, err)
		}
		if matched {
			return true, nil
		}
	}
	return false, nil
}

type checker struct {
	navPath    string
	existing   set.Set[string]
	referenced map[string]int
	result     *checkResult
}

func (c *checker) visit(entries []navEntry) {
	for _, entry := range entries {
		switch entry.kind {
		case kindSection:
			c.visit(entry.children)
		case kindPage:
			c.checkPage(entry)
		case kindCrossSourcePage, kindLink:
			// Validated by the website, which knows the other documentations and the pages of the website.
		}
	}
}

func (c *checker) checkPage(entry navEntry) {
	page := path.Clean(strings.TrimPrefix(entry.target, "./"))
	switch {
	case page == ".." || strings.HasPrefix(page, "../") || path.IsAbs(page):
		c.result.errors = append(c.result.errors, fmt.Sprintf("%s:%d: the page %q is outside of the documentation", c.navPath, entry.line, entry.target))
	case !c.existing.Contains(page):
		c.result.errors = append(c.result.errors, fmt.Sprintf("%s:%d: the page %q doesn't exist", c.navPath, entry.line, entry.target))
	case c.referenced[page] > 0:
		c.result.warnings = append(c.result.warnings, fmt.Sprintf("%s:%d: the page %q is already referenced at line %d", c.navPath, entry.line, entry.target, c.referenced[page]))
	default:
		c.referenced[page] = entry.line
	}
}

// check validates the navigation of the documentation located in docsDir. The pages matching one of the ignored
// patterns (path.Match syntax, relative to docsDir, for example `dev/*.md`) don't need to be referenced.
func check(docsDir string, ignoredPatterns set.Set[string]) (checkResult, error) {
	navPath := filepath.Join(docsDir, navFile)
	data, err := os.ReadFile(navPath) // nolint:gosec
	if err != nil {
		return checkResult{}, fmt.Errorf("unable to read the navigation: %w", err)
	}
	pages, err := listPages(docsDir)
	if err != nil {
		return checkResult{}, fmt.Errorf("unable to list the pages of the documentation: %w", err)
	}
	result := checkResult{pages: len(pages)}
	entries, err := parse(data)
	if err != nil {
		for _, line := range strings.Split(err.Error(), "\n") {
			result.errors = append(result.errors, fmt.Sprintf("%s: %s", navPath, line))
		}
		return result, nil
	}

	c := &checker{navPath: navPath, existing: set.New(pages...), referenced: map[string]int{}, result: &result}
	c.visit(entries)

	for _, page := range pages {
		if c.referenced[page] > 0 {
			continue
		}
		ignored, ignoreErr := isIgnored(page, ignoredPatterns)
		if ignoreErr != nil {
			return result, ignoreErr
		}
		if !ignored {
			result.errors = append(result.errors, fmt.Sprintf("%s: the page is not referenced in %s", filepath.Join(docsDir, filepath.FromSlash(page)), navPath))
		}
	}
	return result, nil
}

// DocsNav validates the navigation of the documentation of a repository from the command line.
type DocsNav interface {
	// SetDocsDir sets the directory containing the documentation. The default is `docs`.
	SetDocsDir(dir string) DocsNav
	// AddIgnoredPattern adds patterns (path.Match syntax, relative to the documentation directory) of pages that don't
	// need to be referenced in the navigation. Adding the same pattern multiple times has no effect.
	AddIgnoredPattern(patterns ...string) DocsNav
	// RegisterFlags registers the command-line flags. This is mandatory to call this method before calling Execute.
	RegisterFlags()
	// Execute validates the navigation and exits with an error when it is not valid.
	Execute()
}

// New returns a DocsNav validating the documentation located in `docs`, with its navigation in `docs/nav.yaml`.
func New() DocsNav {
	return &docsNav{docsDir: defaultDocsDir, ignoredPatterns: set.New[string]()}
}

type docsNav struct {
	docsDir         string
	ignoredPatterns set.Set[string]
}

func (d *docsNav) SetDocsDir(dir string) DocsNav {
	d.docsDir = dir
	return d
}

func (d *docsNav) AddIgnoredPattern(patterns ...string) DocsNav {
	d.ignoredPatterns.Add(patterns...)
	return d
}

func (d *docsNav) RegisterFlags() {
	flag.StringVar(&d.docsDir, "docs-dir", d.docsDir, "Directory containing the documentation and its navigation file "+navFile+".")
	flag.Func("ignore", "Pattern (path.Match syntax, relative to the documentation directory) of pages that don't need to be referenced in the navigation. Can be repeated.", func(pattern string) error {
		if _, err := path.Match(pattern, ""); err != nil {
			return err
		}
		d.ignoredPatterns.Add(pattern)
		return nil
	})
}

func (d *docsNav) Execute() {
	result, err := check(d.docsDir, d.ignoredPatterns)
	if err != nil {
		logrus.Fatal(err)
	}
	for _, warning := range result.warnings {
		logrus.Warn(warning)
	}
	if len(result.errors) > 0 {
		for _, e := range result.errors {
			logrus.Error(e)
		}
		logrus.Fatalf("The navigation of the documentation is not valid: every page of %s must be referenced in %s and every page it references must exist. See https://github.com/perses/website for the syntax.", d.docsDir, filepath.Join(d.docsDir, navFile))
	}
	fmt.Printf("The navigation of the documentation is valid (%d pages).\n", result.pages)
}

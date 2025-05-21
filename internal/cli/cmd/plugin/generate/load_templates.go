// Copyright 2025 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package generate

import (
	"embed"
	"fmt"
	"io/fs"
	"path/filepath"
	"regexp"
	"strings"
	"unicode"

	"text/template"
)

//go:embed templates/**/*
var embeddedTemplates embed.FS

const tmplExt = ".tmpl"

func CollectTemplatePaths(srcDir string, templateSet *template.Template) ([]string, error) {
	var err error

	var templateFiles []string

	// Walk through the template directory and parse all template files
	err = fs.WalkDir(embeddedTemplates, srcDir, func(path string, info fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		if strings.HasSuffix(info.Name(), tmplExt) {
			relativePath, relErr := filepath.Rel(srcDir, path)
			if relErr != nil {
				return fmt.Errorf("could not get relative path for %s: %w", path, relErr)
			}

			if templateSet.Lookup(relativePath) != nil {
				return nil
			}

			tmpl := templateSet.New(relativePath)

			fileContent, readErr := fs.ReadFile(embeddedTemplates, path)
			if readErr != nil {
				return fmt.Errorf("could not read template file %s: %w", path, readErr)
			}

			_, parseErr := tmpl.Parse(string(fileContent))
			if parseErr != nil {
				return fmt.Errorf("could not parse template file %s: %w", path, parseErr)
			}

			templateFiles = append(templateFiles, relativePath)
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return templateFiles, nil
}

var hyphenRegex = regexp.MustCompile("-+")

func applyCamelCaseToHyphen(s string) string {
	if s == "" {
		return ""
	}
	runes := []rune(s)
	var builder strings.Builder

	for i, currentRune := range runes {
		if i > 0 && unicode.IsUpper(currentRune) {
			prevRune := runes[i-1]
			if unicode.IsLower(prevRune) || (unicode.IsUpper(prevRune) && i+1 < len(runes) && unicode.IsLower(runes[i+1])) {
				builder.WriteRune('-')
			}
		}
		builder.WriteRune(currentRune)
	}
	return builder.String()
}

func GetKebabCase(name string) string {
	if name == "" {
		return ""
	}

	processedName := applyCamelCaseToHyphen(name)
	processedName = strings.ReplaceAll(processedName, " ", "-")
	processedName = strings.ToLower(processedName)
	processedName = hyphenRegex.ReplaceAllString(processedName, "-")
	processedName = strings.Trim(processedName, "-")

	return processedName
}

func GetPascalCase(name string) string {
	if name == "" {
		return ""
	}

	split := func(r rune) bool {
		return r == ' ' || r == '_' || r == '-'
	}

	words := strings.FieldsFunc(name, split)
	var sb strings.Builder

	for _, word := range words {
		if len(word) == 0 {
			continue
		}
		runes := []rune(word)
		runes[0] = unicode.ToUpper(runes[0])
		sb.WriteString(string(runes))
	}

	return sb.String()
}

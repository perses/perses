// Copyright The Perses Authors
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

package migrate

import (
	"regexp"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// maxMetadataNameLength is the maximum length allowed for a resource name (metadata.name).
// It matches the limit enforced by github.com/perses/spec/go/common.ValidateID.
const maxMetadataNameLength = 75

// invalidMetadataNameChar matches every character that is not allowed in a resource name.
var invalidMetadataNameChar = regexp.MustCompile(`[^a-zA-Z0-9_.-]`)

// generateMetadataName generates a valid Perses resource name (metadata.name) from a display
// string. It mirrors the frontend helper of the same name (ui/app/src/utils/metadata.ts):
// accents are removed from alphabetical characters and every character that is not allowed in
// an ID is replaced by an underscore. It additionally truncates the result to the maximum name
// length so that the generated name always satisfies common.ValidateID.
func generateMetadataName(display string) string {
	// NFD normalization splits accented characters into their base letter and a combining mark,
	// then runes.Remove drops those marks (Unicode category Mn, "Mark, nonspacing").
	name, _, err := transform.String(transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC), display)
	if err != nil {
		// transform.String only fails if the underlying transformer fails, which cannot happen
		// with the chain above. Fall back to the raw display to stay defensive.
		name = display
	}
	name = invalidMetadataNameChar.ReplaceAllString(name, "_")
	if len(name) > maxMetadataNameLength {
		name = name[:maxMetadataNameLength]
	}
	return name
}

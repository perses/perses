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

package validate

import (
	"fmt"
	"maps"
	"regexp"
	"slices"
	"strings"

	"github.com/perses/spec/go/dashboard"
)

// linkURLSchemeRegexp matches the scheme of an absolute URL, as defined by RFC 3986.
var linkURLSchemeRegexp = regexp.MustCompile(`^([a-zA-Z][a-zA-Z0-9+.\-]*):`)

// allowedLinkURLSchemes are the schemes a link can use. Any other scheme (javascript, data, vbscript, ...) could
// execute a script in the Perses origin when the link is followed.
// Besides the web and communication schemes, it includes the deep links of applications commonly used from dashboards,
// which are handed off to the operating system.
// Keep it aligned with the list of the UI (components/src/utils/url.ts in perses/shared).
var allowedLinkURLSchemes = []string{
	"http",
	"https",
	"mailto",
	"tel",
	"sms",
	"slack",
	"msteams",
	"vscode",
	"vscode-insiders",
	"zoommtg",
}

// browserIgnoredURLChars are the characters removed from a URL by the browsers before parsing it.
// See https://url.spec.whatwg.org/#concept-basic-url-parser
var browserIgnoredURLChars = strings.NewReplacer("\t", "", "\n", "", "\r", "")

// validateLinkURL verifies the URL of a link is either relative or uses one of the allowed schemes.
// A URL whose scheme is provided by a variable (e.g. "$target") can't be verified here,
// it is the responsibility of the UI to verify the URL once the variables are interpolated.
func validateLinkURL(rawURL string) error {
	// Normalize the URL the way the browsers do before resolving it, so a scheme can't be hidden behind leading
	// control characters or spaces, or split with tabs or newlines.
	normalizedURL := strings.TrimFunc(rawURL, func(r rune) bool { return r <= ' ' })
	normalizedURL = browserIgnoredURLChars.Replace(normalizedURL)
	matches := linkURLSchemeRegexp.FindStringSubmatch(normalizedURL)
	if matches == nil {
		return nil
	}
	if !slices.Contains(allowedLinkURLSchemes, strings.ToLower(matches[1])) {
		return fmt.Errorf("the scheme %q is not allowed, only relative URLs and the following schemes are allowed: %s", matches[1], strings.Join(allowedLinkURLSchemes, ", "))
	}
	return nil
}

func validateLinks(spec dashboard.Spec) error {
	for i, link := range spec.Links {
		if err := validateLinkURL(link.URL); err != nil {
			return fmt.Errorf("invalid URL of the dashboard link #%d: %w", i+1, err)
		}
	}
	for _, panelName := range slices.Sorted(maps.Keys(spec.Panels)) {
		panel := spec.Panels[panelName]
		if panel == nil {
			continue
		}
		for i, link := range panel.Spec.Links {
			if err := validateLinkURL(link.URL); err != nil {
				return fmt.Errorf("invalid URL of the link #%d of the panel %q: %w", i+1, panelName, err)
			}
		}
	}
	return nil
}

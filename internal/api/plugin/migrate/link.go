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
	"strings"

	"github.com/perses/spec/go/dashboard"
)

// grafanaTagLink converts a Grafana dashboards-type link. The boolean is false
// when the link is not a tag menu, so the caller keeps the URL conversion.
// A tag menu with no usable tag or no title is dropped: Perses rejects a link
// that has neither a URL nor tags.
func grafanaTagLink(grafanaLink GrafanaLink) (dashboard.Link, bool) {
	tags := nonEmptyTags(grafanaLink.Tags)
	isTagMenu := grafanaLink.Type == "dashboards" || (strings.TrimSpace(grafanaLink.URL) == "" && len(tags) > 0)
	if !isTagMenu {
		return dashboard.Link{}, false
	}
	if len(tags) == 0 || strings.TrimSpace(grafanaLink.Title) == "" {
		return dashboard.Link{}, false
	}
	return dashboard.Link{
		Name:             strings.TrimSpace(grafanaLink.Title),
		Tags:             tags,
		KeepTime:         grafanaLink.KeepTime,
		IncludeVariables: grafanaLink.IncludeVars,
		Tooltip:          grafanaLink.Tooltip,
	}, true
}

func nonEmptyTags(tags []string) []string {
	cleaned := make([]string, 0, len(tags))
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}
		cleaned = append(cleaned, tag)
	}
	return cleaned
}

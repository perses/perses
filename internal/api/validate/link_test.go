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
	"testing"

	"github.com/perses/spec/go/dashboard"
	"github.com/stretchr/testify/assert"
)

func TestValidateLinkURL(t *testing.T) {
	validURLs := []string{
		"https://perses.dev",
		"http://localhost:3000/projects/perses/dashboards/demo?var-job=node",
		"HTTPS://PERSES.DEV",
		"//perses.dev/docs",
		"/projects/perses/dashboards/demo",
		"projects/perses",
		"./explore?data=%24var",
		"?var-job=node",
		"#panel-1",
		"",
		"mailto:perses@example.com",
		// The scheme is provided by a variable, it is verified by the UI once interpolated.
		"$target",
		"${target}/path",
		"java${script}:alert(1)",
		"/explore?url=javascript:alert(1)",
	}
	for _, url := range validURLs {
		t.Run(url, func(t *testing.T) {
			assert.NoError(t, validateLinkURL(url))
		})
	}

	invalidURLs := []string{
		"javascript:alert(document.domain)",
		"JaVaScRiPt:alert(1)",
		" javascript:alert(1)",
		"\x00javascript:alert(1)",
		"\x1fjavascript:alert(1)",
		"java\tscript:alert(1)",
		"java\nscript:alert(1)",
		"java\rscript:alert(1)",
		"javascript\t:alert(1)",
		"data:text/html,<script>alert(1)</script>",
		"vbscript:msgbox(1)",
		"file:///etc/passwd",
		"blob:https://perses.dev/uuid",
		"ftp://perses.dev",
	}
	for _, url := range invalidURLs {
		t.Run(url, func(t *testing.T) {
			assert.ErrorContains(t, validateLinkURL(url), "is not allowed")
		})
	}
}

func TestDashboardSpecLinks(t *testing.T) {
	panelWithLinks := func(links ...dashboard.Link) *dashboard.Panel {
		return &dashboard.Panel{Kind: "Panel", Spec: dashboard.PanelSpec{Links: links}}
	}
	testSuites := []struct {
		title       string
		spec        dashboard.Spec
		expectedErr string
	}{
		{
			title: "valid dashboard and panel links",
			spec: dashboard.Spec{
				Links: []dashboard.Link{{URL: "https://perses.dev"}, {URL: "/projects/perses"}},
				Panels: map[string]*dashboard.Panel{
					"a":    panelWithLinks(dashboard.Link{URL: "$target"}),
					"b":    panelWithLinks(),
					"null": nil,
				},
			},
		},
		{
			title: "javascript URL in a dashboard link",
			spec: dashboard.Spec{
				Links: []dashboard.Link{{URL: "https://perses.dev"}, {URL: "javascript:alert(document.domain)"}},
			},
			expectedErr: `invalid URL of the dashboard link 1: the scheme "javascript" is not allowed, only relative URLs and the http, https and mailto schemes are allowed`,
		},
		{
			title: "javascript URL in a panel link",
			spec: dashboard.Spec{
				Panels: map[string]*dashboard.Panel{
					"a": panelWithLinks(dashboard.Link{URL: "https://perses.dev"}),
					"b": panelWithLinks(dashboard.Link{URL: "/explore"}, dashboard.Link{URL: "javascript:alert(document.domain)"}),
				},
			},
			expectedErr: `invalid URL of the link 1 of the panel "b": the scheme "javascript" is not allowed, only relative URLs and the http, https and mailto schemes are allowed`,
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			err := DashboardSpec(test.spec, nil, nil)
			if len(test.expectedErr) == 0 {
				assert.NoError(t, err)
			} else {
				assert.EqualError(t, err, test.expectedErr)
			}
		})
	}
}

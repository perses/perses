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

package search

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/index"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var _ = index.Client(&fakeIndex{})

// fakeIndex returns the same results, in the same order, whatever the query.
type fakeIndex struct {
	results []*index.SearchResult
}

func (f *fakeIndex) List(_ echo.Context, _ v1.Kind, _ string) ([]*index.SearchResult, error) {
	return f.results, nil
}

func (f *fakeIndex) Search(_ echo.Context, _ v1.Kind, _ string, _ string) ([]*index.SearchResult, error) {
	return f.results, nil
}

func (f *fakeIndex) Refresh() error {
	return nil
}

func (f *fakeIndex) Add(_ api.Entity) error {
	return nil
}

func (f *fakeIndex) Delete(_ v1.Kind, _ api.Metadata) {}

func newResult(name, displayName string, score uint64) *index.SearchResult {
	return &index.SearchResult{
		Metadata: &v1.ProjectMetadata{
			Metadata:               v1.Metadata{Name: name},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{Project: "project"},
		},
		DisplayName: displayName,
		Score:       score,
	}
}

func TestDashboard_sorted(t *testing.T) {
	searchResults := func() []*index.SearchResult {
		return []*index.SearchResult{
			newResult("zookeeper", "Zookeeper", 10),
			newResult("node", "Node Exporter", 20),
			newResult("apache", "Apache", 10),
		}
	}
	testsCases := []struct {
		title    string
		url      string
		results  []*index.SearchResult
		expected []string
	}{
		{
			title:    "not sorted without the parameter",
			url:      "/search/dashboards?query=e",
			results:  searchResults(),
			expected: []string{"Zookeeper", "Node Exporter", "Apache"},
		},
		{
			title:    "sorted ascending",
			url:      "/search/dashboards?query=e&sorted=asc",
			results:  searchResults(),
			expected: []string{"Apache", "Zookeeper", "Node Exporter"},
		},
		{
			title:    "sorted descending",
			url:      "/search/dashboards?query=e&sorted=desc",
			results:  searchResults(),
			expected: []string{"Node Exporter", "Apache", "Zookeeper"},
		},
		{
			// Without a query, the endpoint lists the dashboards, which all have a score of 0.
			title: "list sorted alphabetically",
			url:   "/search/dashboards?sorted=desc",
			results: []*index.SearchResult{
				newResult("zookeeper", "Zookeeper", 0),
				newResult("node", "Node Exporter", 0),
				newResult("apache", "Apache", 0),
			},
			expected: []string{"Apache", "Node Exporter", "Zookeeper"},
		},
	}
	for _, tc := range testsCases {
		t.Run(tc.title, func(t *testing.T) {
			endpoint := &endpoint{index: &fakeIndex{results: tc.results}}
			rec := httptest.NewRecorder()
			ctx := echo.New().NewContext(httptest.NewRequest(http.MethodGet, tc.url, nil), rec)

			require.NoError(t, endpoint.Dashboard(ctx))
			assert.Equal(t, http.StatusOK, rec.Code)
			var results []struct {
				DisplayName string `json:"displayName"`
			}
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &results))
			names := make([]string, len(results))
			for i, r := range results {
				names[i] = r.DisplayName
			}
			assert.Equal(t, tc.expected, names)
		})
	}
}

func TestDashboard_invalidSortOrder(t *testing.T) {
	endpoint := &endpoint{index: &fakeIndex{}}
	ctx := echo.New().NewContext(httptest.NewRequest(http.MethodGet, "/search/dashboards?sorted=score", nil), httptest.NewRecorder())

	err := endpoint.Dashboard(ctx)
	assert.ErrorIs(t, err, apiInterface.BadRequestError)
}

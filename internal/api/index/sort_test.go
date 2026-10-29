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

package index

import (
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func newSortTestResult(project, name, displayName string, score uint64) *SearchResult {
	return &SearchResult{
		Metadata: &v1.ProjectMetadata{
			Metadata:               v1.Metadata{Name: name},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{Project: project},
		},
		DisplayName: displayName,
		Score:       score,
	}
}

func displayNames(results []*SearchResult) []string {
	names := make([]string, len(results))
	for i, r := range results {
		names[i] = r.DisplayName
	}
	return names
}

func TestSortResults(t *testing.T) {
	testsCases := []struct {
		title    string
		order    SortOrder
		results  []*SearchResult
		expected []string
	}{
		{
			title: "not sorted when the order is empty",
			order: SortOrderNone,
			results: []*SearchResult{
				newSortTestResult("p", "zookeeper", "Zookeeper", 10),
				newSortTestResult("p", "node", "Node Exporter", 20),
				newSortTestResult("p", "apache", "Apache", 10),
			},
			expected: []string{"Zookeeper", "Node Exporter", "Apache"},
		},
		{
			title: "ascending score, then alphabetical",
			order: SortOrderAsc,
			results: []*SearchResult{
				newSortTestResult("p", "zookeeper", "Zookeeper", 10),
				newSortTestResult("p", "node", "Node Exporter", 20),
				newSortTestResult("p", "apache", "Apache", 10),
			},
			expected: []string{"Apache", "Zookeeper", "Node Exporter"},
		},
		{
			title: "descending score, then still alphabetical",
			order: SortOrderDesc,
			results: []*SearchResult{
				newSortTestResult("p", "zookeeper", "Zookeeper", 10),
				newSortTestResult("p", "node", "Node Exporter", 20),
				newSortTestResult("p", "apache", "Apache", 10),
			},
			expected: []string{"Node Exporter", "Apache", "Zookeeper"},
		},
		{
			title: "alphabetical order is case-insensitive",
			order: SortOrderDesc,
			results: []*SearchResult{
				newSortTestResult("p", "b", "beta", 0),
				newSortTestResult("p", "a", "Alpha", 0),
				newSortTestResult("p", "c", "Charlie", 0),
			},
			expected: []string{"Alpha", "beta", "Charlie"},
		},
		{
			title: "perfect matches come first in descending order",
			order: SortOrderDesc,
			results: []*SearchResult{
				newSortTestResult("p", "nodeexporter", "nodeexporter", 16),
				newSortTestResult("p", "node", "node", perfectMatchScore),
			},
			expected: []string{"node", "nodeexporter"},
		},
	}
	for _, tc := range testsCases {
		t.Run(tc.title, func(t *testing.T) {
			SortResults(tc.results, tc.order)
			assert.Equal(t, tc.expected, displayNames(tc.results))
		})
	}
}

func TestSortResults_sameScoreAndDisplayName(t *testing.T) {
	results := []*SearchResult{
		newSortTestResult("project-b", "overview", "Overview", 5),
		newSortTestResult("project-a", "overview-2", "Overview", 5),
		newSortTestResult("project-a", "overview-1", "Overview", 5),
	}
	SortResults(results, SortOrderDesc)

	var keys []string
	for _, r := range results {
		m := r.Metadata.(*v1.ProjectMetadata)
		keys = append(keys, m.Project+"/"+m.Name)
	}
	assert.Equal(t, []string{"project-a/overview-1", "project-a/overview-2", "project-b/overview"}, keys)
}

func TestSortOrderValidate(t *testing.T) {
	testsCases := []struct {
		title       string
		order       SortOrder
		expectedErr bool
	}{
		{title: "none", order: SortOrderNone},
		{title: "ascending", order: SortOrderAsc},
		{title: "descending", order: SortOrderDesc},
		{title: "upper case", order: "ASC", expectedErr: true},
		{title: "full word", order: "ascending", expectedErr: true},
		{title: "unknown", order: "score", expectedErr: true},
	}
	for _, tc := range testsCases {
		t.Run(tc.title, func(t *testing.T) {
			err := tc.order.Validate()
			if tc.expectedErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

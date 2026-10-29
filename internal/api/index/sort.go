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
	"cmp"
	"fmt"
	"slices"
	"strings"

	"github.com/perses/perses/internal/api/utils"
)

// SortOrder is the order of the search results based on their score.
type SortOrder string

const (
	// SortAsc sorts the results from the lowest to the highest score.
	SortAsc SortOrder = "asc"
	// SortDesc sorts the results from the highest to the lowest score, i.e. the best matches first.
	SortDesc SortOrder = "desc"
)

func (s SortOrder) Validate() error {
	switch s {
	case "", SortAsc, SortDesc:
		return nil
	default:
		return fmt.Errorf("invalid sort order %q, it must be either %q or %q", s, SortAsc, SortDesc)
	}
}

// sortKey contains the values used to sort a search result, computed once per result.
type sortKey struct {
	result      *SearchResult
	displayName string
	project     string
	name        string
}

// SortResults sorts the results by score in the given order. When the order is empty, the results are not sorted.
// The results with the same score are sorted alphabetically by display name (case-insensitive), whatever the order,
// then by project and name so that the order is always the same.
func SortResults(results []*SearchResult, order SortOrder) {
	if order == "" || len(results) < 2 {
		return
	}
	keys := make([]sortKey, len(results))
	for i, r := range results {
		keys[i] = sortKey{
			result:      r,
			displayName: strings.ToLower(r.DisplayName),
			project:     utils.GetMetadataProject(r.Metadata),
			name:        r.Metadata.GetName(),
		}
	}
	slices.SortFunc(keys, func(a, b sortKey) int {
		var c int
		if order == SortDesc {
			c = cmp.Compare(b.result.Score, a.result.Score)
		} else {
			c = cmp.Compare(a.result.Score, b.result.Score)
		}
		if c != 0 {
			return c
		}
		return cmp.Or(
			cmp.Compare(a.displayName, b.displayName),
			cmp.Compare(a.result.DisplayName, b.result.DisplayName),
			cmp.Compare(a.project, b.project),
			cmp.Compare(a.name, b.name),
		)
	})
	for i, k := range keys {
		results[i] = k.result
	}
}

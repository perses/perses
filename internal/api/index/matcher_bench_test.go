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

import "testing"

// BenchmarkMatcherMatch measures the matching of a query against a single indexed field.
// A search runs it against the indexed fields of every dashboard the user can read, so it is the hot path of the search.
// See index_bench_test.go for the benchmarks of the whole search index, and how to compare them with benchstat.
func BenchmarkMatcherMatch(b *testing.B) {
	scenarios := []struct {
		name          string
		excludedChars []string
		query         string
		txt           string
		expectMatch   bool
	}{
		{
			name:        "perfect-match",
			query:       "node exporter full",
			txt:         "Node Exporter Full",
			expectMatch: true,
		},
		{
			name:        "contiguous-match",
			query:       "exporter",
			txt:         "Node Exporter Full",
			expectMatch: true,
		},
		{
			name:        "scattered-match",
			query:       "kube pod",
			txt:         "Kubernetes / Compute Resources / Namespace (Pods)",
			expectMatch: true,
		},
		{
			// The first character of the query is never found: the text is only scanned.
			name:  "no-match/first-char-missing",
			query: "zookeeper",
			txt:   "Node Exporter Full",
		},
		{
			// The beginning of the query is found, but not its end.
			name:  "no-match/partial",
			query: "windows",
			txt:   "Kubernetes / Networking / Pod",
		},
		{
			name:          "excluded-chars",
			excludedChars: []string{"_", "-", " ", "/"},
			query:         "nodeexporter",
			txt:           "Node_Exporter_Full",
			expectMatch:   true,
		},
		{
			// The first character of the query appears many times in the text: each occurrence is a candidate match.
			name:        "long-text",
			query:       "requests",
			txt:         "Kubernetes / Compute Resources / Namespace (Workloads) / Production cluster eu-west-1 / CPU and memory requests vs limits",
			expectMatch: true,
		},
	}
	for _, sc := range scenarios {
		b.Run(sc.name, func(b *testing.B) {
			m := &matcher{caseSensitive: false, excludedChars: sc.excludedChars}
			if result := m.match(sc.query, sc.txt); (result != nil) != sc.expectMatch {
				b.Fatalf("match(%q, %q) = %+v, expected a match: %t", sc.query, sc.txt, result, sc.expectMatch)
			}
			b.ReportAllocs()
			for b.Loop() {
				m.match(sc.query, sc.txt)
			}
		})
	}
}

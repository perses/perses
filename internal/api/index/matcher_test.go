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
	"math"
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/search"
	"github.com/stretchr/testify/assert"
)

func TestSearchMatch(t *testing.T) {
	tests := []struct {
		name          string
		caseSensitive bool
		excludedChars []string
		query         string
		txt           string
		expected      *search.Result
	}{
		{
			name:          "perfect match",
			caseSensitive: true,
			query:         "abc",
			txt:           "abc",
			expected: &search.Result{
				Original: "abc",
				Intervals: []search.MatchingInterval{
					{From: 0, To: 2},
				},
				Score: math.MaxUint64,
			},
		},
		{
			name:          "perfect match case insensitive",
			caseSensitive: false,
			query:         "ABC",
			txt:           "abc",
			expected: &search.Result{
				Original: "abc",
				Intervals: []search.MatchingInterval{
					{From: 0, To: 2},
				},
				Score: math.MaxUint64,
			},
		},
		{
			name:          "no match",
			caseSensitive: true,
			query:         "xyz",
			txt:           "abcdef",
			expected:      nil,
		},
		{
			name:          "query longer than text",
			caseSensitive: true,
			query:         "abcdef",
			txt:           "abc",
			expected:      nil,
		},
		{
			name:          "subsequence match with gaps",
			caseSensitive: true,
			query:         "bd",
			txt:           "abcd",
			expected: &search.Result{
				Original: "abcd",
				Intervals: []search.MatchingInterval{
					{From: 1, To: 1},
					{From: 3, To: 3},
				},
				Score: 2,
			},
		},
		{
			name:          "best contiguous match preferred over scattered match",
			caseSensitive: true,
			query:         "bac",
			txt:           "babac",
			expected: &search.Result{
				Original: "babac",
				Intervals: []search.MatchingInterval{
					{From: 2, To: 4},
				},
				Score: 9,
			},
		},
		{
			name:          "case insensitive subsequence match",
			caseSensitive: false,
			query:         "FUZ",
			txt:           "fzduzf",
			expected: &search.Result{
				Original: "fzduzf",
				Intervals: []search.MatchingInterval{
					{From: 0, To: 0},
					{From: 3, To: 4},
				},
				Score: 5,
			},
		},
		{
			name:          "excluded characters are ignored",
			caseSensitive: true,
			excludedChars: []string{"-"},
			query:         "ab",
			txt:           "a-b",
			expected: &search.Result{
				Original: "a-b",
				Intervals: []search.MatchingInterval{
					{From: 0, To: 0},
					{From: 2, To: 2},
				},
				Score: 2,
			},
		},
		{
			name:          "empty query and text produce a perfect match",
			caseSensitive: true,
			query:         "",
			txt:           "",
			expected: &search.Result{
				Original:  "",
				Intervals: []search.MatchingInterval{{From: 0, To: 0}},
				Score:     math.MaxUint64,
			},
		},
		{
			name:          "empty query with non-empty text produces no match",
			caseSensitive: true,
			query:         "",
			txt:           "abc",
			expected:      nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := &matcher{
				caseSensitive: tt.caseSensitive,
				excludedChars: tt.excludedChars,
			}
			result := s.match(tt.query, tt.txt)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestScore(t *testing.T) {
	tests := []struct {
		title         string
		intervals     []search.MatchingInterval
		txtLength     uint64
		expectedScore uint64
	}{
		{
			title:         "no intervals",
			intervals:     []search.MatchingInterval{},
			txtLength:     0,
			expectedScore: 0,
		},
		{
			title: "one interval with a size of one",
			intervals: []search.MatchingInterval{
				{From: 0, To: 0},
			},
			txtLength:     2,
			expectedScore: 1,
		},
		{
			title: "two intervals with a size of one",
			intervals: []search.MatchingInterval{
				{From: 0, To: 0},
				{From: 3, To: 3},
			},
			txtLength:     5,
			expectedScore: 2,
		},
		{
			// The interval starts at index 2, so getPreviousNonsearch.MatchingInterval returns
			// a leading gap of size 2. With a txtLength of 10, the penalty (2/10) rounds down to 0.
			title: "interval not starting at the beginning of the text applies a leading gap penalty",
			intervals: []search.MatchingInterval{
				{From: 2, To: 4},
			},
			txtLength:     10,
			expectedScore: 9, // size(3)^2 = 9, penalty rounds to 0
		},
		{
			// Score increases quadratically with the size of a contiguous interval.
			title: "a single contiguous interval increases the score quadratically",
			intervals: []search.MatchingInterval{
				{From: 0, To: 3},
			},
			txtLength:     4,
			expectedScore: 16, // size(4)^2 = 16
		},
		{
			// The gap between index 0 and index 5 has a size of 5, which is bigger than the
			// txtLength (3), so the penalty (5/3 = 1) exceeds the gain (1^2 = 1) from the match itself.
			title: "a gap bigger than the text length can bring the score down to zero",
			intervals: []search.MatchingInterval{
				{From: 5, To: 5},
			},
			txtLength:     3,
			expectedScore: 0,
		},
		{
			// The gap between the two intervals has a size of 9, at least as large as the txtLength (8),
			// so it introduces a penalty of 1 that offsets part of the score gained from the second interval.
			title: "a gap at least as large as the text length reduces the score by the penalty",
			intervals: []search.MatchingInterval{
				{From: 0, To: 0},
				{From: 10, To: 10},
			},
			txtLength:     8,
			expectedScore: 1,
		},
		{
			// Combines three intervals of size one, each separated by a small gap, none of which is
			// large enough compared to txtLength to introduce a penalty.
			title: "three intervals compound their gains without penalties",
			intervals: []search.MatchingInterval{
				{From: 0, To: 0},
				{From: 4, To: 4},
				{From: 9, To: 9},
			},
			txtLength:     10,
			expectedScore: 3,
		},
	}
	for _, tt := range tests {
		t.Run(tt.title, func(t *testing.T) {
			result := score(tt.intervals, tt.txtLength)
			assert.Equal(t, tt.expectedScore, result)
		})
	}
}

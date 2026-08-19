// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package index

import (
	"math"
	"slices"
	"strings"

	"github.com/perses/perses/pkg/model/api"
)

// MatchingInterval represents the start and the end position of the continuous characters that is matching the pattern.
// For example, for the pattern `bc`, with the string `abcd`, the corresponding interval will be [{from: 1, to: 2}]
// Another example, for the pattern `fuz`, with the string `fzduzf`, the corresponding intervals will be:
// [ { from: 0, to: 0 }, { from: 3, to: 4 } ]
type MatchingInterval struct {
	From uint64 `json:"from"`
	// To is always superior to From
	To uint64 `json:"to"`
}

func (m MatchingInterval) Size() uint64 {
	return m.To - m.From + 1
}

// SearchResult is the result of a search query. It contains the metadata of the resource that matches the query,
// the original string that matches the query, and the list of intervals that gives you the position of the characters that match the query in the original string.
// Note for developers: this struct is not in the pkg/model/api/v1/search package to avoid generating them with cuelang and facing issues with cuelang when generating the package pkg/model/api.
type SearchResult struct {
	// Metadata is the metadata of the resource that matches the query.
	Metadata api.Metadata `json:"metadata" yaml:"metadata"`
	// DisplayName is the string that will be used for the search display.
	DisplayName string `json:"displayName" yaml:"displayName"`
	// The original string that matches the query.
	// It can be empty if the query is empty.
	Original string `json:"original,omitempty"`
	// The list of intervals that match the query.
	// It can be empty if the query is empty.
	Intervals []MatchingInterval `json:"intervals,omitempty"`
	// Score is the score of the match, the higher the score, the better the match.
	// When there is a perfect match, then the number is infinite.
	// It can be equal to 0 if the query is empty.
	Score uint64 `json:"score,omitempty"`
}

type Query struct {
	Project string `query:"project"`
	Query   string `query:"query"`
}

type matcher struct {
	caseSensitive bool
	// List of characters that should be ignored in the pattern or in the word used for matching
	excludedChars []string
}

// match returns a result only if the query matches the text.
func (m *matcher) match(query string, txt string) *SearchResult {
	localQuery := query
	localTxt := txt
	if !m.caseSensitive {
		localQuery = strings.ToLower(query)
		localTxt = strings.ToLower(txt)
	}
	// in case it's a perfect match, no need to loop to find which char is matching
	if localQuery == localTxt {
		to := 0
		if len(txt) > 0 {
			to = len(txt) - 1
		}
		return &SearchResult{
			Original: txt,
			Intervals: []MatchingInterval{
				{
					From: 0,
					// The convertion here is not a security issue.
					// We are sure that the value is not negative because we are checking the length of the string before.
					// So, the value will always be positive, and the conversion to uint64 is safe.
					To: uint64(to), //nolint:gosec
				},
			},
			// A perfect match get the maximum score, so it will be the first result in the list of results.
			Score: math.MaxUint64,
		}
	}
	if len(localQuery) == 0 {
		// if the query is empty, then we should not return any result.
		return nil
	}
	var intervals []MatchingInterval
	finalScore := uint64(0)
	// The logic is the following:
	// each time a char is matching the first char of the pattern
	// loop other the rest of the text to generate the different matching interval.
	// Like that, we will be able to find the best matching possibility.
	// For example, given the pattern `bac` and the text `babac`
	// instead of matching `<ba>ba<c>, it will match ba<bac> which has a better score than the previous one.
	for i := 0; i < len(localTxt)-len(localQuery)+1; i++ {
		// if the first char of the pattern is not matching the current char of the text, we can skip this iteration.
		if localTxt[i] != localQuery[0] {
			continue
		}
		matchingIntervals := m.generateMatchingIntervals(localQuery, localTxt, i)
		// In case there is no intervals, then we can break immediately the loop.
		// This is because it means there is no other letters that is matching, and we will not be able to find a better score.
		if len(matchingIntervals) == 0 {
			break
		}
		// On the opposite, if we are able to find a matching interval, we can compute the score and keep the best matching.
		currentScore := score(matchingIntervals, uint64(len(txt)))
		if currentScore > finalScore {
			intervals = matchingIntervals
			finalScore = currentScore
		}
	}
	if len(intervals) == 0 {
		return nil
	}
	return &SearchResult{
		Original:  txt,
		Intervals: intervals,
		Score:     finalScore,
	}
}

// generateMatchingIntervals is finding an occurrence of the query in the text starting from the given index.
func (m *matcher) generateMatchingIntervals(query string, txt string, idxTxt int) []MatchingInterval {
	queryIdx := 0
	i := idxTxt
	var result []MatchingInterval
	for i < len(txt) && queryIdx < len(query) {
		// First, we are ignoring any excluded characters
		if slices.Contains(m.excludedChars, string(txt[i])) {
			i++
			// Here we continue to ensure we are still inside the txt, otherwise we might have an index out of range error.
			continue
		}
		// For safety, we do the same thing for the query.
		// I am saying "for safety", because if we are excluding characters, this because they are not usually typed by users while searching.
		// But just in case, we are ignoring it as well.
		if slices.Contains(m.excludedChars, string(query[queryIdx])) {
			queryIdx++
			continue
		}
		// If the current characters of the text and the query match, then we can create an interval and try to find the next characters that is matching.
		if txt[i] == query[queryIdx] {
			interval := MatchingInterval{
				// The convertion here is not a security issue.
				// The value will always be positive, and the conversion to uint64 is safe.
				From: uint64(i), //nolint:gosec
				To:   uint64(i), //nolint:gosec
			}
			// We are trying to find the next characters that is matching, so we are incrementing both indexes.
			i++
			queryIdx++
			// Here we are fast forwarding to the next characters that is not matching anymore. Until finding it, we are updating the interval and updating the indexes.
			for j := i; j < len(txt) && queryIdx < len(query) && txt[j] == query[queryIdx]; j++ {
				interval.To = uint64(j) //nolint:gosec
				queryIdx++
				i = j
			}
			result = append(result, interval)
		}
		i++
	}
	if len(result) == 0 || queryIdx < len(query) {
		// it means we were not able to find a matching interval for the whole query, so we can return nil.
		return nil
	}
	return result
}

// getPreviousNonMatchingInterval is returning the interval that is not matching the query and that is just before the given interval.
func getPreviousNonMatchingInterval(intervals []MatchingInterval, intervalIdx int) *MatchingInterval {
	currentInterval := intervals[intervalIdx]
	if intervalIdx == 0 && currentInterval.From != 0 {
		// In that case, we are at the first interval, but it does not start at the beginning of the text.
		// So, we need to determinate the interval from 0 to the first one
		return &MatchingInterval{
			From: 0,
			To:   currentInterval.From - 1,
		}
	}
	if intervalIdx > 0 {
		previousInterval := intervals[intervalIdx-1]
		return &MatchingInterval{
			From: previousInterval.To + 1,
			To:   currentInterval.From - 1,
		}
	}
	return nil
}

// score calculate the score based on the intervals created during the matching step.
// Here is how the score is determined:
//  1. Consecutive characters should increase the score more than linearly
//  2. Higher is a distance between the characters, higher it reduces the score.
//     As an example, take the query 'abc', the following strings are sorted by the highest score
//     abcdef > defabc > abec > defabec
func score(matchingIntervals []MatchingInterval, txtSize uint64) uint64 {
	var result uint64 = 0
	for i, interval := range matchingIntervals {
		previousInterval := getPreviousNonMatchingInterval(matchingIntervals, i)
		if previousInterval != nil {
			result = result - previousInterval.Size()/txtSize
		}
		result = result + uint64(math.Pow(float64(interval.Size()), 2))
	}
	return result
}

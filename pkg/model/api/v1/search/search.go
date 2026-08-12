package search

import "github.com/perses/perses/pkg/model/api"

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

type Result struct {
	// Metadata is the metadata of the resource that matches the query.
	Metadata api.Metadata `json:"metadata" yaml:"metadata"`
	// DisplayName is the string that will be used for the search display.
	DisplayName string `json:"displayName" yaml:"displayName"`
	// The original string that matches the query.
	Original string `json:"original"`
	// The list of intervals that match the query.
	Intervals []MatchingInterval `json:"intervals"`
	// Score is the score of the match, the higher the score, the better the match.
	// When there is a perfect match, then the number is infinite.
	Score uint64 `json:"score"`
}

type Query struct {
	Project string `query:"project"`
	Query   string `query:"query"`
}

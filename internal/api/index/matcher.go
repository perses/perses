package index

import (
	"math"
	"slices"
	"strings"

	"github.com/perses/perses/pkg/model/api/v1/search"
)

type matcher struct {
	caseSensitive bool
	// List of characters that should be ignored in the pattern or in the word used for matching
	excludedChars []string
}

// match returns a result only if the query matches the text.
func (m *matcher) match(query string, txt string) *search.Result {
	localQuery := query
	localTxt := txt
	if !m.caseSensitive {
		localQuery = strings.ToLower(query)
		localTxt = strings.ToLower(txt)
	}
	// in case it's a perfect match, no need to loop to find which char is matching
	if localQuery == localTxt {
		return &search.Result{
			Original: txt,
			Intervals: []search.MatchingInterval{
				{
					From: 0,
					To:   uint64(len(txt) - 1),
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
	var intervals []search.MatchingInterval
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
		currentScore := score(matchingIntervals, len(txt))
		if currentScore > finalScore {
			intervals = matchingIntervals
			finalScore = currentScore
		}
	}
	if len(intervals) == 0 {
		return nil
	}
	return &search.Result{
		Original:  txt,
		Intervals: intervals,
		Score:     finalScore,
	}
}

// generateMatchingIntervals is finding an occurrence of the query in the text starting from the given index.
func (m *matcher) generateMatchingIntervals(query string, txt string, idxTxt int) []search.MatchingInterval {
	queryIdx := 0
	i := idxTxt
	var result []search.MatchingInterval
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
			interval := search.MatchingInterval{
				From: uint64(i),
				To:   uint64(i),
			}
			// We are trying to find the next characters that is matching, so we are incrementing both indexes.
			i++
			queryIdx++
			// Here we are fast forwarding to the next characters that is not matching anymore. Until finding it, we are updating the interval and updating the indexes.
			for j := i; j < len(txt) && queryIdx < len(query) && txt[j] == query[queryIdx]; j++ {
				interval.To = uint64(j)
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
func getPreviousNonMatchingInterval(intervals []search.MatchingInterval, intervalIdx int) *search.MatchingInterval {
	currentInterval := intervals[intervalIdx]
	if intervalIdx == 0 && currentInterval.From != 0 {
		// In that case, we are at the first interval, but it does not start at the beginning of the text.
		// So, we need to determinate the interval from 0 to the first one
		return &search.MatchingInterval{
			From: 0,
			To:   currentInterval.From - 1,
		}
	}
	if intervalIdx > 0 {
		previousInterval := intervals[intervalIdx-1]
		return &search.MatchingInterval{
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
func score(matchingIntervals []search.MatchingInterval, txtSize int) uint64 {
	result := 0
	for i, interval := range matchingIntervals {
		previousInterval := getPreviousNonMatchingInterval(matchingIntervals, i)
		if previousInterval != nil {
			result = result - int(previousInterval.Size())/txtSize
		}
		result = result + int(math.Pow(float64(interval.Size()), 2))
	}
	return uint64(result)
}

package config

import "github.com/perses/spec/go/common"

type IndexKeys struct {
	Dashboard []string `json:"dashboard" yaml:"dashboard"`
}

type Search struct {
	// CheckLatestUpdateInterval that checks if the index cache needs to be refreshed with db content. Only for SQL database setup.
	CheckLatestUpdateInterval common.Duration `json:"check_latest_update_interval,omitempty" yaml:"check_latest_update_interval,omitempty"`
	// ExcludedChars is the list of characters that will be excluded from the search engine.
	ExcludedChars []string  `json:"excluded_chars" yaml:"excluded_chars"`
	IndexKeys     IndexKeys `json:"index_keys" yaml:"index_keys"`
}

func (e *Search) Verify() error {
	if e.CheckLatestUpdateInterval <= 0 {
		e.CheckLatestUpdateInterval = common.Duration(defaultCacheInterval)
	}
	if e.IndexKeys.Dashboard == nil {
		e.IndexKeys.Dashboard = []string{"metadata.name", "spec.display.name"}
	}
	return nil
}

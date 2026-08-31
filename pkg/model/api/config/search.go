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

package config

import "github.com/perses/spec/go/common"

type IndexKeys struct {
	Dashboard []string `json:"dashboard,omitempty" yaml:"dashboard,omitempty"`
}

type Search struct {
	// CheckLatestUpdateInterval is the interval when it checks if the index cache needs to be refreshed with db content. Only for SQL database setup.
	CheckLatestUpdateInterval common.Duration `json:"check_latest_update_interval,omitempty" yaml:"check_latest_update_interval,omitempty"`
	// ExcludedChars is the list of characters that will be excluded from the search engine.
	ExcludedChars []string  `json:"excluded_chars,omitempty" yaml:"excluded_chars,omitempty"`
	IndexKeys     IndexKeys `json:"index_keys,omitempty" yaml:"index_keys,omitempty"`
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

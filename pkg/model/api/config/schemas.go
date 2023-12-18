// Copyright 2023 The Perses Authors
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

package config

import (
	"time"

	"github.com/prometheus/common/model"
)

const (
	DefaultPanelsPath      = "schemas/panels"
	DefaultQueriesPath     = "schemas/queries"
	DefaultDatasourcesPath = "schemas/datasources"
	DefaultVariablesPath   = "schemas/variables"
	defaultInterval        = 1 * time.Hour
)

type Schemas struct {
	PanelsPath      string         `json:"panels_path,omitempty" yaml:"panels_path,omitempty"`
	QueriesPath     string         `json:"queries_path,omitempty" yaml:"queries_path,omitempty"`
	DatasourcesPath string         `json:"datasources_path,omitempty" yaml:"datasources_path,omitempty"`
	VariablesPath   string         `json:"variables_path,omitempty" yaml:"variables_path,omitempty"`
	Interval        model.Duration `json:"interval,omitempty" yaml:"interval,omitempty"`
}

func (s *Schemas) Verify() error {
	if len(s.PanelsPath) == 0 {
		s.PanelsPath = DefaultPanelsPath
	}
	if len(s.QueriesPath) == 0 {
		s.QueriesPath = DefaultQueriesPath
	}
	if len(s.DatasourcesPath) == 0 {
		s.DatasourcesPath = DefaultDatasourcesPath
	}
	if len(s.VariablesPath) == 0 {
		s.VariablesPath = DefaultVariablesPath
	}
	if s.Interval <= 0 {
		s.Interval = model.Duration(defaultInterval)
	}
	return nil
}

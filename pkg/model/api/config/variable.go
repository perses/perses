// Copyright 2025 The Perses Authors
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

type GlobalVariableConfig struct {
	// Disable is used to disable the global variable feature.
	// Note that if the global datasource is disabled, the global variable will also be disabled.
	Disable bool `json:"disable" yaml:"disable"`
}

type ProjectVariableConfig struct {
	// Disable is used to disable the project variable feature.
	// Note that if the global datasource and the project datasource are disabled,
	// then the project variable will also be disabled.
	Disable bool `json:"disable" yaml:"disable"`
}

type VariableConfig struct {
	Global  GlobalVariableConfig  `json:"global" yaml:"global"`
	Project ProjectVariableConfig `json:"project" yaml:"project"`
	// DisableLocal when used is preventing the possibility to add a variable directly in the dashboard spec.
	DisableLocal bool `json:"disable_local" yaml:"disable_local"`
}

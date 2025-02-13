// Copyright 2024 The Perses Authors
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

// This package offers an utility to build a dashboards easily, by allowing
// to provide panels together with their layout.

package dashboard

import (
	"github.com/perses/perses/cuelang/model/api/v1"
	v1Common "github.com/perses/perses/cuelang/model/api/v1/common"
	v1Dashboard "github.com/perses/perses/cuelang/model/api/v1/dashboard"
)

// expected user inputs
#name:     string
#project?: string
#display?: v1Common.#Display
#panelGroups: [string]: {
	layout: v1Dashboard.#Layout
	panels: [string]: v1.#Panel
}
#variables?: [...v1Dashboard.#Variable]
#datasources?: [string]: v1.#DatasourceSpec
#duration?:        string
#refreshInterval?: string

// output: the dashboard in the format expected by Perses 
v1.#Dashboard & {
	metadata: {
		name: #name
		if #project != _|_ {
			project: #project
		}
	}
	spec: {
		if #display != _|_ {
			display: #display
		}
		if #datasources != _|_ {
			datasources: #datasources
		}
		if #variables != _|_ {
			variables: #variables
		}
		panels: {for group in #panelGroups {group.panels}}
		layouts: [for group in #panelGroups {group.layout}]
		if #duration != _|_ {
			duration: #duration
		}
		if #refreshInterval != _|_ {
			refreshInterval: #refreshInterval
		}
	}
}

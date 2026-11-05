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

// This package offers an utility to build a dashboards easily, by allowing
// to provide panels together with their layout.
@experiment(explicitopen)

package dashboard

import (
	"github.com/perses/perses/cue/model/api/v1"
	"github.com/perses/spec/cue/common"
	"github.com/perses/spec/cue/dashboard"
	"github.com/perses/spec/cue/datasource"
)

// expected user inputs
#name:     string
#project?: string
#display?: common.#Display
#panelGroups: [string]: {
	layout: dashboard.#Layout
	panels: [string]: dashboard.#Panel
}
#variables?: [...dashboard.#Variable]
#datasources?: [string]: datasource.#Spec
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

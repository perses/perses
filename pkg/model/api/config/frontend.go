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

package config

type Explorer struct {
	Enable bool `json:"enable" yaml:"enable"`
}

type Frontend struct {
	// When it is true, Perses won't serve the frontend anymore, and any other config set here will be ignored
	Deactivate bool `json:"deactivate" yaml:"deactivate"`
	// Explorer is activating the different kind of explorer supported.
	// Be sure you have installed an associated plugin for each explorer type.
	Explorer Explorer `json:"explorer" yaml:"explorer"`
	// Information contains markdown content to be display on the home page
	Information string `json:"information,omitempty" yaml:"information,omitempty"`
	// ImportantDashboards contains important dashboard selectors
	ImportantDashboards []dashboardSelector `json:"important_dashboards,omitempty" yaml:"important_dashboards,omitempty"`
}

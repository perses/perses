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

// Package panels exposes reusable node-exporter panels.
// This file holds shared helpers used by every panel of the package, so it
// shows up as a library dependency of every dashboard that imports the package.
package panels

// #datasourceName is the Prometheus datasource queried by all panels.
#datasourceName: "promDemo"

// #filter is the common label selector applied to every PromQL query.
#filter: "instance=~\"$instance\""


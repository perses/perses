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

// Package variables exposes reusable variable builders.
// Only the ContainerMonitoring dashboard imports it, hence it resolves to a
// single dashboard in the dependency graph.
package variables

import (
	"github.com/perses/perses/go-sdk/dashboard"
	txtVar "github.com/perses/perses/go-sdk/variable/text-variable"
)

// Instance adds an "instance" text variable used to scope the queries.
func Instance() dashboard.Option {
	return dashboard.AddVariable("instance",
		txtVar.Text("localhost:9100"),
	)
}


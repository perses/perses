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

// Package common gathers what is shared by the different kinds of datasource proxy (HTTP, SQL).
package common

const (
	DatasourceFieldLog = "datasource"
	ProjectFieldLog    = "project"
)

// ProjectForLog returns a meaningful log value for the project field.
// For global datasources (where project is empty), it returns "<global>" to make logs clearer.
func ProjectForLog(project string) string {
	if project == "" {
		return "<global>"
	}
	return project
}

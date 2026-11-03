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

package fakev1

import (
	v1 "github.com/perses/perses/pkg/client/api/v1"
)

const (
	FakeDashboardSchema = "#Dashboard: {\n\tkind: \"Dashboard\"\n\t...\n}\n"
	FakePluginsSchema   = "{}\n"
)

type schema struct {
	v1.SchemaInterface
}

func (c *schema) Dashboard() ([]byte, error) {
	return []byte(FakeDashboardSchema), nil
}

func (c *schema) Plugins() ([]byte, error) {
	return []byte(FakePluginsSchema), nil
}

func (c *schema) Plugin(_ string, _ *v1.PluginSchemaQuery) ([]byte, error) {
	return []byte(FakePluginsSchema), nil
}

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

package v1

import (
	"fmt"
	"net/url"

	"github.com/perses/perses/pkg/client/perseshttp"
)

const schemaResource = "schemas"

var (
	dashboardSchemaResource = fmt.Sprintf("%s/dashboards", schemaResource)
	pluginSchemaResource    = fmt.Sprintf("%s/plugins", schemaResource)
)

// SchemaInterface gives access to the CUE schemas served by the Perses server.
// The schemas are returned as raw CUE source code.
type SchemaInterface interface {
	// Dashboard returns the complete dashboard schema, including the schemas of all the loaded plugins.
	// It defines the definition #Dashboard, which can be used to validate a dashboard,
	// for example with `cue vet -d '#Dashboard' schema.cue dashboard.json`.
	Dashboard() ([]byte, error)
	// Plugins returns the schema definitions of all the loaded plugins.
	Plugins() ([]byte, error)
	// Plugin returns the schema definition of the plugin with the given name.
	// query is optional and can be used to select a specific version or registry of the plugin.
	// It returns perseshttp.RequestNotFoundError when the plugin is not found.
	Plugin(name string, query *PluginSchemaQuery) ([]byte, error)
}

// PluginSchemaQuery is the optional query used to select a specific plugin schema.
// When a field is empty, the server uses its default value (the latest version and the default registry).
type PluginSchemaQuery struct {
	Version  string
	Registry string
}

func (q *PluginSchemaQuery) GetValues() url.Values {
	values := make(url.Values)
	// A nil *PluginSchemaQuery passed to Request.Query is a non-nil interface, so it must be handled here.
	if q == nil {
		return values
	}
	if len(q.Version) > 0 {
		values["version"] = []string{q.Version}
	}
	if len(q.Registry) > 0 {
		values["registry"] = []string{q.Registry}
	}
	return values
}

type schema struct {
	SchemaInterface
	client *perseshttp.RESTClient
}

func newSchema(client *perseshttp.RESTClient) SchemaInterface {
	return &schema{
		client: client,
	}
}

func (c *schema) Dashboard() ([]byte, error) {
	return c.client.Get().
		Resource(dashboardSchemaResource).
		Do().
		Bytes()
}

func (c *schema) Plugins() ([]byte, error) {
	return c.client.Get().
		Resource(pluginSchemaResource).
		Do().
		Bytes()
}

func (c *schema) Plugin(name string, query *PluginSchemaQuery) ([]byte, error) {
	return c.client.Get().
		Resource(pluginSchemaResource).
		Name(name).
		Query(query).
		Do().
		Bytes()
}

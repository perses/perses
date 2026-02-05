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

	"github.com/perses/perses/pkg/client/perseshttp"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	pluginModel "github.com/perses/perses/pkg/model/api/v1/plugin"
)

const pluginResource = "plugins"

var devPluginResource = fmt.Sprintf("%s/dev", pluginResource)

type PluginInterface interface {
	PushDevPlugin([]*v1.PluginInDevelopment) error
	RefreshDevPlugin(metadata pluginModel.ModuleMetadata) error
	UnLoadDevPlugin(metadata pluginModel.ModuleMetadata) error
	List() ([]v1.PluginModule, error)
}

type plugin struct {
	PluginInterface
	client *perseshttp.RESTClient
}

func newPlugin(client *perseshttp.RESTClient) PluginInterface {
	return &plugin{
		client: client,
	}
}

func (c *plugin) PushDevPlugin(plugins []*v1.PluginInDevelopment) error {
	return c.client.Post().
		Resource(devPluginResource).
		Body(plugins).
		Do().
		Error()
}

func (c *plugin) RefreshDevPlugin(metadata pluginModel.ModuleMetadata) error {
	return c.client.Post().
		Resource(fmt.Sprintf("%s/refresh", devPluginResource)).
		Body(metadata).
		Do().
		Error()
}

func (c *plugin) UnLoadDevPlugin(metadata pluginModel.ModuleMetadata) error {
	return c.client.Delete().
		Resource(devPluginResource).
		Body(metadata).
		Do().
		Error()
}

func (c *plugin) List() ([]v1.PluginModule, error) {
	var result []v1.PluginModule
	err := c.client.Get().
		Resource(pluginResource).
		Do().
		Object(&result)
	return result, err
}

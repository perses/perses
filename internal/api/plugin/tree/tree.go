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

package tree

import (
	"github.com/perses/spec/go/module"
	"github.com/perses/spec/go/plugin"
	"golang.org/x/mod/semver"
)

type Node struct {
	Name     string
	registry string
}

func newNode(name, registry string) Node {
	if registry == "" {
		registry = plugin.DefaultRegistry
	}
	return Node{Name: name, registry: registry}
}

func Merge[T any](a, b Tree[T]) Tree[T] {
	result := make(Tree[T])
	for key, versions := range a {
		if _, ok := result[key]; !ok {
			result[key] = make(map[string]T)
		}
		for version, instance := range versions {
			result[key][version] = instance
		}
	}
	for key, versions := range b {
		for version, instance := range versions {
			if version == plugin.LatestVersion {
				continue
			}
			// Here we are adding manually to ensure the latest version pointer is correctly set.
			result.Add(key.Name, module.Metadata{Registry: key.registry, Version: version}, instance)
		}
	}
	return result
}

// Entry holds a node and its associated latest-version instance.
type Entry[T any] struct {
	Node     Node
	Instance T
}

// Tree is a struct used to manage the loaded plugin instances.
// This struct is here to allow to manage multiple versions of the same plugin and the latest version of the plugin.
// The first map key is the node (name + registry).
// The second map key is the version of the plugin.
type Tree[T any] map[Node]map[string]T

func (t Tree[T]) Add(name string, moduleMetadata module.Metadata, instance T) {
	key := newNode(name, moduleMetadata.Registry)
	moduleVersion := moduleMetadata.Version
	if _, ok := t[key]; !ok {
		t[key] = make(map[string]T)
	}
	t[key][moduleVersion] = instance
	if t.isLatest(key, moduleVersion) {
		t[key][plugin.LatestVersion] = instance
	}
}

func (t Tree[T]) Remove(name string, moduleMetadata module.Metadata) {
	key := newNode(name, moduleMetadata.Registry)
	moduleVersion := moduleMetadata.Version
	if _, ok := t[key]; !ok {
		return
	}
	delete(t[key], moduleVersion)
	if t.isLatest(key, moduleVersion) {
		// In case this is the latest version, we need to update the latest version pointer
		latestVer := t.getLatestVersion(key)
		if latestVer == "" {
			// It means there is no more version left, we can delete the latest pointer
			delete(t[key], plugin.LatestVersion)
			// If there is no more version at all, we can delete the key
			delete(t, key)
		} else {
			t[key][plugin.LatestVersion] = t[key][latestVer]
		}
	}
}

// Get is retrieving the instance of the plugin based on the given name and moduleMetadata.
// While moduleMetadata is containing a field `Name`, we are not using it as the name passed can differ from the one in the metadata.
//
// For example, when loading a schema, the name passed is the name of the schema, while the moduleMetadata.Name is the name of the module containing the schema.
// In the Prometheus plugin case, the schema name can be `PrometheusTimeSeriesQuery`, while the module name is `prometheus`.
//
// The name and metadata.name can also be the same.
func (t Tree[T]) Get(name string, moduleMetadata module.Metadata) (T, bool) {
	key := newNode(name, moduleMetadata.Registry)
	moduleVersion := moduleMetadata.Version
	if moduleVersion == "" {
		moduleVersion = plugin.LatestVersion
	}
	if versions, ok := t[key]; ok {
		if instance, ok := versions[moduleVersion]; ok {
			return instance, true
		}
	}
	var emptyValue T
	return emptyValue, false
}

func (t Tree[T]) GetWithPluginMetadata(name string, pluginMetadata *plugin.Metadata) (T, bool) {
	if pluginMetadata == nil {
		return t.Get(name, module.Metadata{Version: plugin.LatestVersion, Registry: plugin.DefaultRegistry})
	}
	return t.Get(name, module.Metadata{Version: pluginMetadata.Version, Registry: pluginMetadata.Registry})
}

// List returns one Entry per node, containing the latest-version instance.
func (t Tree[T]) List() []Entry[T] {
	result := make([]Entry[T], 0, len(t))
	for node, versions := range t {
		if instance, ok := versions[plugin.LatestVersion]; ok {
			result = append(result, Entry[T]{Node: node, Instance: instance})
		}
	}
	return result
}

// isLatest is checking if the given version is the latest one for the given schemaNameKind
func (t Tree[T]) isLatest(key Node, version string) bool {
	for v := range t[key] {
		if v == plugin.LatestVersion {
			continue
		}
		if semver.Compare(version, v) < 0 {
			return false
		}
	}
	return true
}

func (t Tree[T]) getLatestVersion(key Node) string {
	var currentVersion string
	for v := range t[key] {
		if v == plugin.LatestVersion {
			continue
		}
		if semver.Compare(currentVersion, v) < 0 {
			currentVersion = v
		}
	}
	return currentVersion
}

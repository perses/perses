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

// Package index contains the implementation of the indexation and the search engine.
// This is for sure not the best performant search engine produced until that day.
// So, if someone would like to rewrite it by using a better algorithme or a third party libraries, here is few key concepts you will need to respect:
//
// 1. You will need to take care about the permissions. It won't be wise to first through everything and then filter by the permission.
// You should do the opposite. First filter the amount of data based of the permission and then search through the rest.
// 2. The indexation is done by the API server. It means that the indexation is done in memory and not persisted in the database.
// If your third party library is using a database, makes sure it worth it.
// 3. The goal of this search engine is also to provide more information to display in the UI.
// The most wanted thing is the display name of the resource instead of the plain name contained in the metadata.
// Makes sure you are keeping that in mind when you are implementing your own search engine.
// 4. Makes sure to have something a bit generic so you can search through Dashboards, Projects, Datasources.
package index

import (
	"encoding/json"

	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/tidwall/gjson"
)

type index[T api.Metadata] struct {
	metadata T
	// displayName is the string that will be used for the search display.
	displayName string
	// fields is the list of string that has been collected when the index is created.
	// It is used to know which fields are available for search.
	fields []string
}

type client struct {
	// kind is type of resource indexed
	kind v1.Kind
	// indexedKeys is the list of keys that are indexed for the resource.
	// This is used when adding a document to the index to know which fields to extract from the document.
	// For example: if the indexedKeys is ["metadata.name", "metadata.tags"],
	// then the index will extract the value of metadata.name and metadata.tags from the document and use them for the search.
	indexedKeys []string
	// idx is the list of document indexed, used for global resources.
	idx map[string]index[*v1.Metadata]
	// projectIdx is the index used for the resources that belongs to a project.
	projectIdx map[string]map[string]index[*v1.ProjectMetadata]
}

// add is adding a new document to the index.
// The row will be used to find the various field to be indexed depending on the configuration.
// We are treating the raw JSON instead of the struct because then we can index anything and we don't need to deal with the Go struct.
func (c *client) add(raw json.RawMessage) error {
	var fields []string
	for _, k := range c.indexedKeys {
		fields = append(fields, gjson.GetBytes(raw, k).String())
	}
	var displayName string
	displayName = gjson.GetBytes(raw, "spec.display.name").String()
	if len(displayName) == 0 {
		displayName = gjson.GetBytes(raw, "metadata.name").String()
	}
	rawMetadata := gjson.GetBytes(raw, "metadata")
	if v1.IsGlobal(c.kind) {
		var m *v1.Metadata
		if err := json.Unmarshal([]byte(rawMetadata.Raw), &m); err != nil {
			return err
		}
		idx := index[*v1.Metadata]{
			metadata:    m,
			fields:      fields,
			displayName: displayName,
		}
		c.idx[m.Name] = idx
	} else {
		var m *v1.ProjectMetadata
		if err := json.Unmarshal([]byte(rawMetadata.Raw), &m); err != nil {
			return err
		}
		idx := index[*v1.ProjectMetadata]{
			metadata:    m,
			fields:      fields,
			displayName: displayName,
		}
		projectIdx := c.projectIdx[m.Project]
		if projectIdx == nil {
			projectIdx = make(map[string]index[*v1.ProjectMetadata])
			c.projectIdx[m.Project] = projectIdx
		}
		projectIdx[m.Name] = idx
	}
	return nil
}

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
//
// 2. The indexation is done by the API server. It means that the indexation is done in memory and not persisted in the database.
// If your third party library is using a database, makes sure it worth it.
//
// 3. The goal of this search engine is also to provide more information to display in the UI.
// The most wanted thing is the display name of the resource instead of the plain name contained in the metadata.
// Makes sure you are keeping that in mind when you are implementing your own search engine.
//
// 4. Makes sure to have something a bit generic so you can search through Dashboards, Projects, Datasources.
package index

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	"github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/perses/perses/pkg/model/api/v1/search"
	"github.com/sirupsen/logrus"
	"github.com/tidwall/gjson"
)

type rawDocument json.RawMessage

func (r rawDocument) getField(field string) gjson.Result {
	return gjson.GetBytes(r, field)
}

func (r rawDocument) getFields(field string) []gjson.Result {
	return gjson.GetManyBytes(r, field)
}

func (r rawDocument) getDisplayName() string {
	var displayName string
	displayName = r.getField("spec.display.name").String()
	if len(displayName) == 0 {
		displayName = r.getField("metadata.name").String()
	}
	return displayName
}

func (r rawDocument) getRawMetadata() string {
	return gjson.GetBytes(r, "metadata").Raw
}

type index[T api.Metadata] struct {
	metadata T
	// displayName is the string that will be used for the search display.
	displayName string
	// fields is the list of string that has been collected when the index is created.
	// It is used to know which fields are available for search.
	fields []string
	// matcher is the search engine that will be used to search through the fields.
	matcher *matcher
}

func (idx *index[T]) match(text string) *search.Result {
	for _, field := range idx.fields {
		result := idx.matcher.match(text, field)
		if result != nil {
			result.Metadata = idx.metadata
			result.DisplayName = idx.displayName
			return result
		}
	}
	return nil
}

func newProjectIndexer(indexedKeys []string, scope role.Scope, authz authorization.Authorization, matcher *matcher) *projectIndexer {
	return &projectIndexer{
		scope:       scope,
		authz:       authz,
		indexedKeys: indexedKeys,
		idx:         make(map[string]map[string]index[*v1.ProjectMetadata]),
		matcher:     matcher,
	}
}

// projectIndexer is the indexer that will be used to index and search through the resources that belongs to a project.
// Examples of project resources are: Dashboard, Datasource, etc.
type projectIndexer struct {
	// scope is the scope of the resource that will be indexed.
	scope role.Scope
	// authz is the authorization service that will be used to check if the user has the permission to search through the resources.
	authz authorization.Authorization
	// indexedKeys is the list of keys that are indexed for the resource.
	// This is used when adding a document to the index to know which fields to extract from the document.
	// For example: if the indexedKeys is ["metadata.name", "metadata.tags"],
	// then the index will extract the value of metadata.name and metadata.tags from the document and use them for the search.
	indexedKeys []string
	// idx is the index used for the resources that belongs to a project.
	// The first key is the project name, the second key is the resource name.
	idx map[string]map[string]index[*v1.ProjectMetadata]
	// matcher is the search engine that will be used when creating a new index for a resource.
	matcher *matcher
	// mutex will protect the index.
	mutex sync.RWMutex
}

// add is adding a new document to the index.
// The row will be used to find the various field to be indexed depending on the configuration.
// We are treating the raw JSON instead of the struct because then we can index anything; and we don't need to deal with the Go struct.
func (c *projectIndexer) add(raw json.RawMessage) error {
	customRaw := rawDocument(raw)
	var fields []string
	for _, k := range c.indexedKeys {
		fs := customRaw.getFields(k)
		for _, f := range fs {
			if !f.Exists() {
				continue
			}
			// Todo recursively index the fields if they are objects. For now, we are only indexing the string and array of string.
			if f.IsArray() {
				for _, r := range f.Array() {
					fields = append(fields, r.String())
				}
			} else {
				fields = append(fields, f.String())
			}
		}
	}

	displayName := customRaw.getDisplayName()
	rawMetadata := customRaw.getRawMetadata()
	var m *v1.ProjectMetadata
	if err := json.Unmarshal([]byte(rawMetadata), &m); err != nil {
		return err
	}
	idx := index[*v1.ProjectMetadata]{
		metadata:    m,
		fields:      fields,
		displayName: displayName,
		matcher:     c.matcher,
	}
	c.mutex.Lock()
	projectIdx := c.idx[m.Project]
	if projectIdx == nil {
		projectIdx = make(map[string]index[*v1.ProjectMetadata])
		c.idx[m.Project] = projectIdx
	}
	projectIdx[m.Name] = idx
	c.mutex.Unlock()
	return nil
}

func (c *projectIndexer) search(ctx echo.Context, project string, text string) ([]*search.Result, error) {
	var projectList []string
	if len(project) != 0 {
		if c.authz.IsEnabled() {
			// If the project is provided, we need to check if the user has the permission to read the resources in that project.
			if ok := c.authz.HasPermission(ctx, role.ReadAction, project, c.scope); !ok {
				return nil, apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", role.ReadAction, project, c.scope))
			}
		}
		projectList = append(projectList, project)
	} else if c.authz.IsEnabled() {
		// In that case we are searching through all the projects the user has access to.
		var err error
		projectList, err = c.authz.GetUserProjects(ctx, role.ReadAction, c.scope)
		if err != nil {
			return nil, err
		}
	} else {
		// In case the authorization is not enabled, we are searching through all the projects that are indexed.
		c.mutex.RLock()
		for projectName := range c.idx {
			projectList = append(projectList, projectName)
		}
		c.mutex.RUnlock()
	}
	var results []*search.Result
	c.mutex.RLock()
	// In case, there is one result; it can mean the user has global access to the resource across the project.
	// Or it can mean he has access to only one project. If he has global access, then we should search through the whole list.
	if len(projectList) == 1 && projectList[0] == v1.WildcardProject {
		for _, projectIdx := range c.idx {
			for _, idx := range projectIdx {
				if result := idx.match(text); result != nil {
					results = append(results, result)
				}
			}
		}
	} else {
		for _, pr := range projectList {
			projectIdx := c.idx[pr]
			if projectIdx == nil {
				continue
			}
			for _, idx := range projectIdx {
				if result := idx.match(text); result != nil {
					results = append(results, result)
				}
			}
		}
	}

	c.mutex.RUnlock()
	if len(results) == 0 {
		return make([]*search.Result, 0), nil
	}
	return results, nil
}

type Client interface {
	// Search is searching through the index for the given kind and project.
	// The project parameter can be empty, in that case, the search will be done through all the projects.
	Search(ctx echo.Context, kind v1.Kind, project string, txt string) ([]*search.Result, error)
	// Refresh is refreshing the index by reloading all the documents from the database.
	Refresh() error
}

func New(conf config.Search, authz authorization.Authorization, dao model.DAO) Client {
	return &client{
		dashboards: newProjectIndexer(conf.IndexKeys.Dashboard, role.DashboardScope, authz, &matcher{
			caseSensitive: false,
			excludedChars: conf.ExcludedChars,
		}),
		dao: dao,
	}
}

type client struct {
	dashboards *projectIndexer
	dao        model.DAO
}

func (c *client) add(raw json.RawMessage) error {
	kind := v1.Kind(gjson.GetBytes(raw, "kind").String())
	switch kind {
	case v1.KindDashboard:
		return c.dashboards.add(raw)
	default:
		logrus.Warnf("kind %s is not supported for indexing", kind)
		return nil
	}
}

func (c *client) Search(ctx echo.Context, kind v1.Kind, project string, txt string) ([]*search.Result, error) {
	switch kind {
	case v1.KindDashboard:
		return c.dashboards.search(ctx, project, txt)
	default:
		logrus.Warnf("kind %s is not supported for searching", kind)
		return make([]*search.Result, 0), nil
	}
}

func (c *client) Refresh() error {
	ch := make(chan json.RawMessage)
	q := &dashboard.Query{}
	var err error
	go func() {
		err = c.dao.StreamRaw(q, ch)
	}()
	for raw := range ch {
		if addErr := c.add(raw); addErr != nil {
			logrus.WithError(addErr).Error("failed to add document to index")
		}
	}
	return err
}

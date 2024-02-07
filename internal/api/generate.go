// Copyright 2023 The Perses Authors
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

//go:build ignore
// +build ignore

package main

import (
	"bytes"
	"flag"
	"fmt"
	"go/format"
	"log"
	"os"
	"text/template"
	"unicode"
)

var (
	endpointTemplate = template.Must(
		template.New("endpoint").Parse(`{{- $endpoint := . -}}
{{- $package := $endpoint.PackageName -}}
{{- $kind := $endpoint.Kind -}}
// Copyright 2023 The Perses Authors
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

// Code generated. DO NOT EDIT

package {{ $package }}

import (
    "fmt"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/{{ $package }}"
	"github.com/perses/perses/internal/api/toolbox"
	"github.com/perses/perses/internal/api/rbac"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Endpoint struct {
	toolbox  toolbox.Toolbox
	readonly bool
}

func NewEndpoint(service {{ $package }}.Service, rbacService rbac.RBAC, readonly bool, caseSensitive bool) *Endpoint {
	return &Endpoint{
		toolbox: toolbox.New(service, rbacService, v1.Kind{{ $kind }}, caseSensitive),
		readonly: readonly,
	}
}

func (e *Endpoint) CollectRoutes(g *route.Group) {
	group := g.Group(fmt.Sprintf("/%s", utils.Path{{ $kind }}))
{{ if $endpoint.IsProjectResource -}}
	subGroup := g.Group(fmt.Sprintf("/%s/:%s/%s", utils.PathProject, utils.ParamProject, utils.Path{{ $kind }}))
{{- end }}
	if !e.readonly {
		group.POST("", e.Create, false)
{{ if $endpoint.IsProjectResource -}}
		subGroup.POST("", e.Create, false)
		subGroup.PUT(fmt.Sprintf("/:%s", utils.ParamName), e.Update, false)
		subGroup.DELETE(fmt.Sprintf("/:%s", utils.ParamName), e.Delete, false)
{{- else -}}
		group.PUT(fmt.Sprintf("/:%s", utils.ParamName), e.Update, false)
		group.DELETE(fmt.Sprintf("/:%s", utils.ParamName), e.Delete, false)
{{- end }}
	}
	group.GET("", e.List, false)
{{ if $endpoint.IsProjectResource -}}
	subGroup.GET("", e.List, false)
	subGroup.GET(fmt.Sprintf("/:%s", utils.ParamName), e.Get, false)
{{- else -}}
	group.GET(fmt.Sprintf("/:%s", utils.ParamName), e.Get, false)
{{- end }}
}

func (e *Endpoint) Create(ctx echo.Context) error {
	entity := &v1.{{ $kind }}{}
	return e.toolbox.Create(ctx, entity)
}

func (e *Endpoint) Update(ctx echo.Context) error {
	entity := &v1.{{ $kind }}{}
	return e.toolbox.Update(ctx, entity)
}

func (e *Endpoint) Delete(ctx echo.Context) error {
	return e.toolbox.Delete(ctx)
}

func (e *Endpoint) Get(ctx echo.Context) error {
	return e.toolbox.Get(ctx)
}

func (e *Endpoint) List(ctx echo.Context) error {
	q := &{{ $package }}.Query{}
	return e.toolbox.List(ctx, q)
}
`))
	tplFunc = map[string]interface{}{
		"tag":     printTag,
		"unTitle": unTitle,
	}
	interfaceTemplate = template.Must(
		template.New("interface").Funcs(tplFunc).Parse(`{{- $endpoint := . -}}
{{- $package := $endpoint.PackageName -}}
{{- $kind := $endpoint.Kind -}}
// Copyright 2023 The Perses Authors
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

package {{ $package }}

import (
	apiInterface "github.com/perses/perses/internal/api/interface"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Query struct {
	databaseModel.Query
	// NamePrefix is a prefix of the {{ $kind }}.metadata.name that is used to filter the list of the {{ $kind }}.
	// NamePrefix can be empty in case you want to return the full list of {{ $kind }} available.
	NamePrefix string {{ tag "query:\"name\"" }}
{{ if $endpoint.IsProjectResource -}}
	// Project is the exact name of the project. 
	// The value can come from the path of the URL or from the query parameter
	Project string {{ tag "param:\"project\" query:\"project\"" }}
{{ end }}
}

type DAO interface {
	Create(entity *v1.{{ $kind }}) error
	Update(entity *v1.{{ $kind }}) error
{{ if $endpoint.IsProjectResource -}}
	Delete(project string, name string) error
	Get(project string, name string) (*v1.{{ $kind }}, error)
{{- else -}}
	Delete(name string) error
	Get(name string) (*v1.{{ $kind }}, error)
{{- end }}
	List(q databaseModel.Query) ([]*v1.{{ $kind }}, error)
}

type Service interface {
	apiInterface.Service
}
`))
	persistenceTemplate = template.Must(
		template.New("persistence").Funcs(tplFunc).Parse(`{{- $endpoint := . -}}
{{- $package := $endpoint.PackageName -}}
{{- $kind := $endpoint.Kind -}}
{{- $plural := $endpoint.Plural -}}
// Copyright 2023 The Perses Authors
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

package {{ $package }}

import (
	"github.com/perses/perses/internal/api/interface/v1/{{ $package }}"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type dao struct {
	{{ $package }}.DAO
	client databaseModel.DAO
	kind   v1.Kind
}

func NewDAO(persesDAO databaseModel.DAO) {{ $package }}.DAO {
	return &dao{
		client: persesDAO,
		kind:   v1.Kind{{ $kind }},
	}
}

func (d *dao) Create(entity *v1.{{ $kind }}) error {
	return d.client.Create(entity)
}

func (d *dao) Update(entity *v1.{{ $kind }}) error {
	return d.client.Upsert(entity)
}

func (d *dao) Delete({{- if $endpoint.IsProjectResource -}}project string,{{- end -}} name string) error {
{{ if $endpoint.IsProjectResource }}
	return d.client.Delete(d.kind, v1.NewProjectMetadata(project, name))
{{ else }}
	return d.client.Delete(d.kind, v1.NewMetadata(name))
{{ end }}
}

{{ if $endpoint.IsProjectResource }}
func (d *dao) DeleteAll(project string) error {
	return d.client.DeleteByQuery(&{{ $package }}.Query{Project: project})
}
{{ end }}

func (d *dao) Get({{- if $endpoint.IsProjectResource -}}project string,{{- end -}} name string) (*v1.{{ $kind }}, error) {
	entity := &v1.{{ $kind }}{}
{{ if $endpoint.IsProjectResource -}}
	return entity, d.client.Get(d.kind, v1.NewProjectMetadata(project, name), entity)
{{ else }}
	return entity, d.client.Get(d.kind, v1.NewMetadata(name), entity)
{{- end }}
}

func (d *dao) List(q databaseModel.Query) ([]*v1.{{ $kind }}, error) {
	var result []*v1.{{ $kind }}
	err := d.client.Query(q, &result)
	return result, err
}

`))
	clientTemplate = template.Must(
		template.New("interface").Funcs(tplFunc).Parse(`{{- $endpoint := . -}}
{{- $package := $endpoint.PackageName -}}
{{- $kind := $endpoint.Kind -}}
{{- $plural := $endpoint.Plural -}}
// Copyright 2023 The Perses Authors
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

// Code generated. DO NOT EDIT

package v1

import (
	"github.com/perses/perses/pkg/client/perseshttp"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

const {{ unTitle $kind }}Resource = "{{ $plural }}"

type {{ $kind }}Interface interface {
	Create(entity *v1.{{ $kind }}) (*v1.{{ $kind }}, error)
	Update(entity *v1.{{ $kind }}) (*v1.{{ $kind }}, error)
	Delete(name string) error
	// Get is returning an unique {{ $kind }}.
	// As such name is the exact value of {{ $kind }}.metadata.name. It cannot be empty.
	// If you want to perform a research by prefix, please use the method List
	Get(name string) (*v1.{{ $kind }}, error)
	// prefix is a prefix of the {{ $kind }}.metadata.name to search for.
	// It can be empty in case you want to get the full list of {{ $kind }} available
	List(prefix string) ([]*v1.{{ $kind }}, error)
}

type {{ unTitle $kind }} struct {
	{{ $kind }}Interface
	client *perseshttp.RESTClient
{{ if $endpoint.IsProjectResource -}}
	project string
{{- end }}
}

func new{{ $kind }}(client *perseshttp.RESTClient {{- if $endpoint.IsProjectResource -}}, project string {{- end}}) {{ $kind }}Interface {
	return &{{ unTitle $kind }}{
		client: client,
{{ if $endpoint.IsProjectResource -}}
		project: project,
{{- end }}
	}
}

func (c *{{ unTitle $kind }}) Create(entity *v1.{{ $kind }}) (*v1.{{ $kind }}, error) {
	result := &v1.{{ $kind }}{}
	err := c.client.Post().
		Resource({{ unTitle $kind }}Resource).
{{ if $endpoint.IsProjectResource -}}
		Project(c.project).
{{- end }}
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *{{ unTitle $kind }}) Update(entity *v1.{{ $kind }}) (*v1.{{ $kind }}, error) {
	result := &v1.{{ $kind }}{}
	err := c.client.Put().
		Resource({{ unTitle $kind }}Resource).
		Name(entity.Metadata.Name).
{{ if $endpoint.IsProjectResource -}}
		Project(c.project).
{{- end }}
		Body(entity).
		Do().
		Object(result)
	return result, err
}

func (c *{{ unTitle $kind }}) Delete(name string) error {
	return c.client.Delete().
		Resource({{ unTitle $kind }}Resource).
		Name(name).
{{ if $endpoint.IsProjectResource -}}
		Project(c.project).
{{- end }}
		Do().
		Error()
}

func (c *{{ unTitle $kind }}) Get(name string) (*v1.{{ $kind }}, error) {
	result := &v1.{{ $kind }}{}
	err := c.client.Get().
		Resource({{ unTitle $kind }}Resource).
		Name(name).
{{ if $endpoint.IsProjectResource -}}
		Project(c.project).
{{- end }}
		Do().
		Object(result)
	return result, err
}

func (c *{{ unTitle $kind }}) List(prefix string) ([]*v1.{{ $kind }}, error) {
	var result []*v1.{{ $kind }}
	err := c.client.Get().
		Resource({{ unTitle $kind }}Resource).
		Query(&query{
			name: prefix,
		}).
{{ if $endpoint.IsProjectResource -}}
		Project(c.project).
{{- end }}
		Do().
		Object(&result)
	return result, err
}

`))
)

func printTag(tag string) string {
	return fmt.Sprintf("`%s`", tag)
}

func unTitle(s string) string {
	a := []rune(s)
	a[0] = unicode.ToLower(a[0])
	return string(a)
}

// endpoint is the struct that will be used to generate the template
type endpoint struct {
	PackageName       string
	Kind              string
	Plural            string
	IsProjectResource bool
}

func generateEndpoint(ept endpoint) {
	folder := fmt.Sprintf("./impl/v1/%s", ept.PackageName)
	fileName := "endpoint.go"
	generateFile(folder, fileName, endpointTemplate, ept, false)
}

func generateInterface(ept endpoint) {
	folder := fmt.Sprintf("./interface/v1/%s", ept.PackageName)
	fileName := "interface.go"
	generateFile(folder, fileName, interfaceTemplate, ept, false)
}

func generatePersistence(ept endpoint) {
	folder := fmt.Sprintf("./impl/v1/%s", ept.PackageName)
	fileName := "persistence.go"
	generateFile(folder, fileName, persistenceTemplate, ept, false)
}

func generateClient(ept endpoint) {
	folder := "../../pkg/client/api/v1/"
	fileName := fmt.Sprintf("%s.go", ept.PackageName)
	// as the endpoint is generated and not adds in git, the client that reflects exactly what is exposed by the endpoint,
	// then should be also ignored by git, and so we can override it.
	generateFile(folder, fileName, clientTemplate, ept, true)
}

func generateFile(folder string, fileName string, tpl *template.Template, ept endpoint, shouldOverride bool) {
	file := fmt.Sprintf("%s/%s", folder, fileName)
	if _, err := os.Stat(folder); os.IsNotExist(err) {
		os.Mkdir(folder, 0755)
	}
	if !shouldOverride {
		// only generate the file if it doesn't exist
		if _, err := os.Stat(file); err == nil {
			return
		}
	}

	builder := &bytes.Buffer{}
	if err := tpl.Execute(builder, ept); err != nil {
		log.Fatal("Error while executing the template:", err)
	}
	data, err := format.Source(builder.Bytes())
	if err != nil {
		log.Fatal("Error while formatting generated code:", err)
	}
	if err := os.WriteFile(file, data, 0644); err != nil {
		log.Fatal("Error writing interface file:", err)
	}
}

func main() {
	pkg := flag.String("package", "", "the name of the package that needs to be generated. It should match the name of the resource you would like to expose through http")
	kind := flag.String("kind", "", "the name of the resource with the appropriate cases")
	isProjectResource := flag.Bool("isProjectResource", false, "if the resource is part of a project.")
	plural := flag.String("plural", "", "")
	flag.Parse()

	if len(*pkg) == 0 || len(*kind) == 0 || len(*plural) == 0 {
		log.Fatal("unable to generate endpoint, missing parameter")
	}
	ept := endpoint{
		PackageName:       *pkg,
		Kind:              *kind,
		IsProjectResource: *isProjectResource,
		Plural:            *plural,
	}
	generateEndpoint(ept)
	generateInterface(ept)
	generatePersistence(ept)
	generateClient(ept)
}

// Copyright 2021 Amadeus s.a.s
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

// +build ignore

package main

import (
	"bytes"
	"flag"
	"fmt"
	"go/format"
	"io/ioutil"
	"log"
	"os"
	"text/template"
)

const tpl = `{{- $endpoint := . -}}
{{- $package := $endpoint.PackageName -}}
{{- $kind := $endpoint.Kind -}}
// Copyright 2021 Amadeus s.a.s
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
	"github.com/perses/perses/internal/api/shared"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Endpoint struct {
	toolbox shared.Toolbox
}

func NewEndpoint(service {{ $package }}.Service) *Endpoint {
	return &Endpoint{
		toolbox: shared.NewToolBox(service),
	}
}

func (e *Endpoint) RegisterRoutes(g *echo.Group) {
	group := g.Group(fmt.Sprintf("/%s", shared.Path{{ $kind }}))
	group.POST("", e.Create)
	group.PUT(fmt.Sprintf("/:%s", shared.ParamName), e.Update)
	group.DELETE(fmt.Sprintf("/:%s", shared.ParamName), e.Delete)
	group.GET(fmt.Sprintf("/:%s", shared.ParamName), e.Get)
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
`

var endpointTemplate = template.Must(
	template.New("").Parse(tpl))

// endpoint is the struct that will be used to generate the template
type endpoint struct {
	PackageName string
	Kind        string
}

func main() {
	pkg := flag.String("package", "", "the name of the package that needs to be generated. It should match the name of the resource you would like to expose through http")
	kind := flag.String("kind", "", "the name of the resource with the appropriate cases")
	flag.Parse()

	if len(*pkg) == 0 || len(*kind) == 0 {
		log.Fatal("unable to generate endpoint, missing parameter")
	}

	folder := fmt.Sprintf("./impl/v1/%s", *pkg)
	if _, err := os.Stat(folder); os.IsNotExist(err) {
		os.Mkdir(folder, 0755)
	}
	endpointFile := fmt.Sprintf("%s/endpoint.go", folder)
	ept := endpoint{
		PackageName: *pkg,
		Kind:        *kind,
	}
	builder := &bytes.Buffer{}
	if err := endpointTemplate.Execute(builder, ept); err != nil {
		log.Fatal("Error while executing the template:", err)
	}
	data, err := format.Source(builder.Bytes())
	if err != nil {
		log.Fatal("Error while formatting generated code:", err)
	}
	if err := ioutil.WriteFile(endpointFile, data, 0644); err != nil {
		log.Fatal("Error writing endpoint file:", err)
	}

}

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
{{- $plural := $endpoint.Plural -}}
{{- $kind := $endpoint.Kind -}}
// Code generated. DO NOT EDIT
package {{ $package }}

import (
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
	projectGroup := g.Group("/{{ $plural }}")
	projectGroup.POST("", e.Create)
}

func (e *Endpoint) Create(ctx echo.Context) error {
	entity := &v1.{{ $kind }}{}
	return e.toolbox.Create(ctx, entity)
}
`

var endpointTemplate = template.Must(
	template.New("").Parse(tpl))

// endpoint is the struct that will be used to generate the template
type endpoint struct {
	PackageName string
	Plural      string
	Kind        string
}

func main() {
	pkg := flag.String("package", "", "the name of the package that needs to be generated. It should match the name of the resource you would like to expose through http")
	plural := flag.String("plural", "", "the plural of the resource name")
	kind := flag.String("kind", "", "the name of the resource with the appropriate cases")
	flag.Parse()

	if len(*pkg) == 0 || len(*plural) == 0 || len(*kind) == 0 {
		log.Fatal("unable to generate endpoint, missing parameter")
	}

	folder := fmt.Sprintf("./impl/v1/%s", *pkg)
	if _, err := os.Stat(folder); os.IsNotExist(err) {
		os.Mkdir(folder, 0755)
	}
	endpointFile := fmt.Sprintf("%s/endpoint.go", folder)
	ept := endpoint{
		PackageName: *pkg,
		Plural:      *plural,
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

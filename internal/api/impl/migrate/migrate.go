// Copyright 2022 The Perses Authors
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

package migrate

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/shared"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

//go:embed mapping.cuepart
var mappingFileBytes []byte

const grafanaDefID = "#grafanaDashboard"

type migrateConf struct {
	schemasPath     string
	defaultValue    string
	placeholderText string
}

// Endpoint is the struct that define all endpoint delivered by the path /migrate
type Endpoint struct {
	schemasConf  config.Schemas
	migrateConfs []migrateConf
}

// New create an instance of the object Endpoint.
// You should have at most one instance of this object as it is only used by the struct api in the method api.registerRoute
func New(schemasConf config.Schemas) *Endpoint {
	return &Endpoint{
		schemasConf: schemasConf,
		migrateConfs: []migrateConf{
			{
				schemasPath: schemasConf.VariablesPath,
				defaultValue: `
					kind: "StaticListVariable"
					spec: {
						values: ["grafana", "migration", "not", "supported"]
					}
				`,
				placeholderText: "%(conditional_variables)",
			},
			{
				schemasPath: schemasConf.PanelsPath,
				defaultValue: `
					kind: "Markdown"
					spec: {
						text: "**Migration from Grafana not supported !**"
					}
				`,
				placeholderText: "%(conditional_panels)",
			},
			{
				schemasPath: schemasConf.QueriesPath,
				defaultValue: `
					kind: "PrometheusTimeSeriesQuery"
					spec: {
						datasource: {
							kind: "PrometheusDatasource"
							name: "MigrationFromGrafanaNotSupported"
						}
						query: "migration_from_grafana_not_supported"
					}
				`,
				placeholderText: "%(conditional_timeserie_queries)",
			},
		},
	}
}

// RegisterRoutes is the method to use to register the routes prefixed by /api
// If the version is not v1, then look at the same method but in the package with the version as the name.
func (e *Endpoint) RegisterRoutes(g *echo.Group) {
	g.POST("/migrate", e.Migrate)
}

// Check is the endpoint that provides the perses dashboard corresponding to the provided grafana dashboard.
func (e *Endpoint) Migrate(ctx echo.Context) error {
	grafanaDashboardBytes, err := io.ReadAll(ctx.Request().Body)
	if err != nil {
		return shared.HandleError(err)
	}

	persesDashboardBytes, err := e.migrate(grafanaDashboardBytes)
	if err != nil {
		return shared.HandleError(err)
	}

	return ctx.JSON(http.StatusOK, persesDashboardBytes)
}

func (e *Endpoint) migrate(grafanaDashboard []byte) (*v1.Dashboard, error) {
	cuectx := cuecontext.New()

	// start building the mapping string from the base cuepart file
	mappingString := string(mappingFileBytes)

	// generate the blocks of conditionals from the plugins mig.cuepart files & replace the placeholders with them
	for _, conf := range e.migrateConfs {
		conditionals, err := getListOfConditions(conf.schemasPath, conf.defaultValue)
		if err != nil {
			logrus.WithError(err).Errorf("Unable to get list of conditions for %s", e.schemasConf.VariablesPath)
		}
		mappingString = strings.Replace(mappingString, conf.placeholderText, conditionals, -1)
	}
	logrus.Tracef("mappingString after placeholders replacement: %s", mappingString)

	// Build a CUE value that is just the received grafana dashboard wrapped in a definition & append this to the mapping string.
	// By putting the dashboard under a def we isolate the fields from the Grafana dashboard together in a common namespace, so that they are not mixed with the
	// ones from the remapping engine. This make sure we have no wrong overlapping between Grafana & Perses objects, and also makes the
	// remapping operations more explicit, with e.g `name: #grafanaDashboard.title` instead of `name: title`.
	grafanaDashboardCueVal := cuectx.CompileString(fmt.Sprintf("%s: _", grafanaDefID))
	grafanaDashboardCueVal = grafanaDashboardCueVal.FillPath(
		cue.ParsePath(grafanaDefID),
		cuectx.CompileBytes(grafanaDashboard),
	)
	if err := grafanaDashboardCueVal.Validate(cue.Final()); err != nil {
		return nil, fmt.Errorf("%w: %s", shared.BadRequestError, err)
	}
	mappingString = fmt.Sprintf("%s\n%#v", mappingString, grafanaDashboardCueVal)
	logrus.Tracef("mappingString after grafanaDashboardCueVal injection: \"%s\"", mappingString)

	// build the CUE value from the mapping string
	mappingCueVal := cuectx.CompileString(mappingString)
	logrus.Tracef("final value: %#v", mappingCueVal)

	// marshall to Json then unmarshall in v1.Dashboard struct to pass the final checks & build the final dashboard to return
	persesDashboardJSON, err := json.Marshal(mappingCueVal)
	if err != nil {
		logrus.WithError(err).Error("Unable to marshall Cue Value to json")
		return nil, fmt.Errorf("%w: %s", shared.InternalError, err)
	}
	var persesDashboard v1.Dashboard
	err = json.Unmarshal(persesDashboardJSON, &persesDashboard)
	if err != nil {
		logrus.WithError(err).Error("Unable to unmarshall JSON bytes to Dashboard struct")
		return nil, fmt.Errorf("%w: %s", shared.InternalError, err)
	}

	return &persesDashboard, nil
}

// getListOfConditions returns the list of conditions built from the mig .cuepart file of each plugin available at this path
func getListOfConditions(schemasPath string, defaultValue string) (string, error) {
	files, err := os.ReadDir(schemasPath)
	if err != nil {
		return "", err
	}

	var listOfConditions strings.Builder

	// first append an empty kind field in order to be able to append a default, fallback case for not covered plugins at the end of the conditions list (see below)
	listOfConditions.WriteString("kind: _\n")

	// process each schema plugin to convert it into a CUE Value
	for _, file := range files {
		migFilePath := filepath.Join(schemasPath, file.Name(), "mig.cuepart")
		contentStr, err := os.ReadFile(migFilePath)
		if err != nil {
			logrus.WithError(err).Debugf("No migration file found at %s, plugin %s will be skipped", migFilePath, file.Name())
			continue
		}

		listOfConditions.WriteString(string(contentStr))
		listOfConditions.WriteString("\n")
	}

	// append a default conditional for any Grafana plugin that has no corresponding Perses plugin
	listOfConditions.WriteString(fmt.Sprintf(`
	if kind == _|_ {
		%s
	}`, defaultValue))
	listOfConditions.WriteString("\n")

	return listOfConditions.String(), nil
}

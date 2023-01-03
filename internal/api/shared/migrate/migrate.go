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

package migrate

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/schemas"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

//go:embed mapping.cuepart
var migrationFileBytes []byte

const (
	grafanaDefID = "#grafanaDashboard"

	variableDefaultValue = `
		kind: "StaticListVariable"
		spec: {
			values: ["grafana", "migration", "not", "supported"]
		}
	`
	variablePlaceholderText = "%(conditional_variables)"

	panelDefaultValue = `
		kind: "Markdown"
		spec: {
			text: "**Migration from Grafana not supported !**"
		}
	`
	panelPlaceholderText = "%(conditional_panels)"

	queryDefaultValue = `
		kind: "PrometheusTimeSeriesQuery"
		spec: {
			datasource: {
				kind: "PrometheusDatasource"
				name: "MigrationFromGrafanaNotSupported"
			}
			query: "migration_from_grafana_not_supported"
		}
	`
	queryPlaceholderText = "%(conditional_timeserie_queries)"
)

type Migration interface {
	Migrate(grafanaDashboard []byte) (*v1.Dashboard, error)
	BuildMigrationSchemaString()
	GetLoaders() []schemas.Loader
}

func New(schemasConf config.Schemas) (Migration, error) {
	cueContext := cuecontext.New()
	m := &mig{
		cuectx: cueContext,
		loaders: []loader{
			&migCuePart{
				context:         cueContext,
				schemasPath:     schemasConf.VariablesPath,
				defaultValue:    variableDefaultValue,
				placeholderText: variablePlaceholderText,
			},
			&migCuePart{
				context:         cueContext,
				schemasPath:     schemasConf.PanelsPath,
				defaultValue:    panelDefaultValue,
				placeholderText: panelPlaceholderText,
			},
			&migCuePart{
				context:         cueContext,
				schemasPath:     schemasConf.QueriesPath,
				defaultValue:    queryDefaultValue,
				placeholderText: queryPlaceholderText,
			},
		},
	}
	if err := m.init(); err != nil {
		return nil, err
	}
	return m, nil
}

type mig struct {
	cuectx                *cue.Context
	migrationSchemaString string
	loaders               []loader
	mutex                 sync.RWMutex
}

func (m *mig) GetLoaders() []schemas.Loader {
	var loaders []schemas.Loader
	for _, l := range m.loaders {
		loaders = append(loaders, l)
	}
	return loaders
}

func (m *mig) BuildMigrationSchemaString() {
	// start building the migration schema from the base .cuepart file
	migrationSchemaString := string(migrationFileBytes)

	// generate the blocks of conditionals from the mig.cuepart files of each plugin & replace the placeholders with them
	for _, l := range m.loaders {
		conditionals := l.getConditions()
		migrationSchemaString = strings.Replace(migrationSchemaString, l.getPlaceholder(), conditionals, -1)
	}
	logrus.Tracef("migrationSchemaString: %s", migrationSchemaString)
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.migrationSchemaString = migrationSchemaString
}

func (m *mig) Migrate(grafanaDashboard []byte) (*v1.Dashboard, error) {
	// Build a CUE value that is just the received grafana dashboard wrapped in a definition. By doing this we isolate the
	// fields from the Grafana dashboard together in a common namespace, so that they are not mixed with the ones from the
	// migration schema. This make sure we have no wrong overlapping between Grafana & Perses objects, and also makes the
	// remapping operations more explicit, with e.g `name: #grafanaDashboard.title` instead of `name: title`.
	grafanaDashboardVal := m.cuectx.CompileString(fmt.Sprintf("%s: _", grafanaDefID))
	grafanaDashboardVal = grafanaDashboardVal.FillPath(
		cue.ParsePath(grafanaDefID),
		m.cuectx.CompileBytes(grafanaDashboard),
	)
	if err := grafanaDashboardVal.Validate(cue.Final()); err != nil {
		return nil, fmt.Errorf("%w: %s", shared.BadRequestError, err)
	}

	// Compile the migration schema using the grafana def to resolve the paths
	m.mutex.RLock()
	mappingVal := m.cuectx.CompileString(m.migrationSchemaString, cue.Scope(grafanaDashboardVal))
	m.mutex.RUnlock()
	if mappingVal.Err() != nil {
		return nil, fmt.Errorf("%w: %s", shared.InternalError, mappingVal.Err())
	}
	logrus.Tracef("final value: %#v", mappingVal)

	// marshall to Json then unmarshall in v1.Dashboard struct to pass the final checks & build the final dashboard to return
	persesDashboardJSON, err := json.Marshal(mappingVal)
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

func (m *mig) init() error {
	for _, l := range m.loaders {
		if err := l.Load(); err != nil {
			return err
		}
	}
	m.BuildMigrationSchemaString()
	return nil
}

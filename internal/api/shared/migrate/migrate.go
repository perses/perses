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
	"errors"
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
	queryPlaceholderText = "%(conditional_timeseries_queries)"
)

func ReplaceInputValue(input map[string]string, grafanaDashboard string) string {
	result := grafanaDashboard
	for key, value := range input {
		result = strings.Replace(result, fmt.Sprintf("$%s", key), value, -1)
		result = strings.Replace(result, fmt.Sprintf("${%s}", key), value, -1)
	}
	return result
}

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

func (m *mig) Migrate(userInput []byte) (*v1.Dashboard, error) {
	// preprocessing in Go before passing it to CUE
	grafanaDashboard := rearrangeGrafanaPanelsWithinExpandedRows(userInput)

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
		logrus.WithError(err).Trace("Unable to wrap the received json into a CUE definition")
		return nil, shared.HandleBadRequestError(err.Error())
	}

	// Compile the migration schema using the grafana def to resolve the paths
	m.mutex.RLock()
	mappingVal := m.cuectx.CompileString(m.migrationSchemaString, cue.Scope(grafanaDashboardVal))
	m.mutex.RUnlock()
	err := mappingVal.Err()
	if err != nil {
		logrus.WithError(err).Trace("Unable to compile the migration schema using the received dashboard to resolve the paths")
		return nil, shared.HandleBadRequestError(fmt.Sprintf("unable to convert to Perses dashboard: %s", err))
	}
	logrus.Tracef("final value: %#v", mappingVal)

	// marshall to JSON then unmarshall in v1.Dashboard struct to pass the final checks & build the final dashboard to return
	persesDashboardJSON, err := json.Marshal(mappingVal)
	if err != nil {
		return nil, fmt.Errorf("%w: Unable to marshall CUE Value to json: %s", shared.InternalError, err)
	}
	var persesDashboard v1.Dashboard
	err = json.Unmarshal(persesDashboardJSON, &persesDashboard)
	if err != nil {
		logrus.WithError(err).Trace("Unable to unmarshall JSON bytes to Dashboard struct")
		return nil, shared.HandleBadRequestError(fmt.Sprintf("the Perses dashboard constraints are not met: %s", err))
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

/**
 * This function addresses an issue we have with Grafana datamodel when it comes to migrating dashboards to Perses: When
 * a row is expanded in Grafana, its children panels are moved up in the main panels list, thus become siblings of the row.
 * When it comes to Perses migration we need to recompose the parent->children relationships. However in its current state
 * the CUE language doesn't permit us to achieve this recomposition, hence this processing in the backend code.
 *
 * So what this function does is basically the following: whenever such pattern is encountered in the panels list:
 * ...
 * row1,
 * panelA,
 * panelB,
 * panelC,
 * row2,
 * ...
 * the objects gets rearranged like:
 * ...
 * row1: {
 *   panelA,
 *   panelB,
 *   panelC,
 * },
 * row2,
 * ...
 */
func rearrangeGrafanaPanelsWithinExpandedRows(grafanaDashboardRaw json.RawMessage) json.RawMessage {
	// unmarshall the received raw Json
	var grafanaDashboard map[string]any
	if err := json.Unmarshal(grafanaDashboardRaw, &grafanaDashboard); err != nil {
		logrus.WithError(err).Error("Unable to unmarshall the received Grafana dashboard")
		return grafanaDashboardRaw
	}

	// retrieve the panels
	if _, found := grafanaDashboard["panels"]; !found {
		logrus.Error(errors.New("expected `panels` field not found"))
		return grafanaDashboardRaw
	}
	panels, ok := grafanaDashboard["panels"].([]any)
	if !ok {
		logrus.Error(errors.New("failed to assert `panels` to array of any"))
		return grafanaDashboardRaw
	}

	// iterate over the panels & achieve recomposition of parent->children relationship when needed
	var newPanelList []map[string]any
	var parentRow map[string]any
	for _, panelAsAny := range panels {
		panel, ok := panelAsAny.(map[string]any)
		if !ok {
			logrus.Error(errors.New("failed to assert current panel to map of any"))
			return grafanaDashboardRaw
		}

		if panel["type"] == "row" {
			if _, found := panel["collapsed"]; !found {
				logrus.Error(errors.New("expected attribute `collapsed` not found in row"))
				return grafanaDashboardRaw
			}
			collapsed, ok := panel["collapsed"].(bool)
			if !ok {
				logrus.Error(errors.New("failed to assert the row's `collapsed` field to bool"))
				return grafanaDashboardRaw
			}

			if parentRow != nil {
				// situation corresponding to this case:
				// row1,   <- current parentRow
				// panelA,
				// panelB,
				// panelC,
				// row2,   <- current iterated panel
				// ...
				// -> in this case, we should stop appending panels to the previously-registered parentRow,
				// because we encountered a new row (we don't care if it is expanded or collapsed), thus we
				// append parentRow to our new panel list. We also reset its value afterwards (parentRow will
				// eventually be set to the newly-encountered row if it matches the expanded condition below)
				newPanelList = append(newPanelList, parentRow)
				parentRow = nil
			}

			if collapsed {
				// any collapsed row should be appended as-is to our new panel list, without modifications.
				newPanelList = append(newPanelList, panel)
			} else {
				// in this case we save the newly-encountered expanded row for the next iteration(s), since
				// it's expanded.  We'll eventually have to append the next panel within it.
				parentRow = panel
			}
		} else {
			if parentRow != nil {
				// situation corresponding to this case:
				// row1,   <- current parentRow
				// panelA,
				// panelB, <- current iterated panel
				// ...
				// -> in this case we have to move this non-row panel inside the saved parentRow
				if _, found := parentRow["panels"]; !found {
					logrus.Error(errors.New("expected attribute `panels` not found in row"))
					return grafanaDashboardRaw
				}
				subPanelsList, ok := parentRow["panels"].([]any)
				if !ok {
					logrus.Error(errors.New("failed to assert the row's `panels` field to array of any"))
					return grafanaDashboardRaw
				}
				parentRow["panels"] = append(subPanelsList, panel)
			} else {
				// situation corresponding to this case:
				// panelA,
				// panelB, <- current iterated panel
				// row1,
				// ...
				// -> in this case we append the panel as-is. Technically this case applies only when there are panels
				// placed before any row
				newPanelList = append(newPanelList, panel)
			}
		}
	}
	// once the loop is over, it's possible that the last row we iterated over was expanded, but the loop finished,
	// thus we need to append it here
	if parentRow != nil {
		newPanelList = append(newPanelList, parentRow)
	}

	// overwrite the previous list of panels with the modified one & return:

	grafanaDashboard["panels"] = newPanelList

	newGrafanaDashboardRaw, err := json.Marshal(grafanaDashboard)
	if err != nil {
		logrus.WithError(err).Error("Unable to marshal the modified dashboard")
		return grafanaDashboardRaw
	}

	return newGrafanaDashboardRaw
}

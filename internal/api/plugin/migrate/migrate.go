// Copyright 2025 The Perses Authors
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
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/build"
	"cuelang.org/go/cue/cuecontext"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/plugin/schema"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/sirupsen/logrus"
)

const (
	grafanaType     = "#grafanaType"
	migrationFolder = "migrate"
)

var kindRegexp = regexp.MustCompile(`(?m)kind\s*:\s*"(\w+)"`)

func LoadMigrateSchema(schemaPath string) (*build.Instance, error) {
	return schema.LoadSchemaInstance(schemaPath, "migrate")
}

func ReplaceInputValue(input map[string]string, grafanaDashboard string) string {
	result := grafanaDashboard
	for key, value := range input {
		// Escape special characters that may be present in the value
		escapedValue := strconv.Quote(value)
		// Remove the extra surrounding quotes added by strconv.Quote
		escapedValue = escapedValue[1 : len(escapedValue)-1]
		// Do the replacement (2 syntaxes to support)
		result = strings.ReplaceAll(result, fmt.Sprintf("$%s", key), escapedValue)
		result = strings.ReplaceAll(result, fmt.Sprintf("${%s}", key), escapedValue)
	}
	return result
}

func Load(pluginPath string, moduleSpec plugin.ModuleSpec) ([]schema.LoadSchema, error) {
	var schemas []schema.LoadSchema
	err := filepath.WalkDir(filepath.Join(pluginPath, moduleSpec.SchemasPath), func(currentPath string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			return nil
		}
		if d.Name() != migrationFolder {
			return nil
		}
		// At this point, we are in the "migrate" directory.
		migrateFilePath := filepath.Join(currentPath, "migrate.cue")
		// We are verifying if the package is a package migrate. Otherwise, we won't be able to use it.
		if isMigrate, openFileErr := isPackageMigrate(migrateFilePath); openFileErr != nil {
			if openFileErr != nil {
				return openFileErr
			}
			if !isMigrate {
				return fs.SkipDir
			}
		}

		instance, schemaErr := LoadMigrateSchema(currentPath)
		if schemaErr != nil {
			return schemaErr
		}
		// Here we are reading the migrate.cue file to determinate which kind of plugin it is supposed to migrate.
		// This is because we can have multiple plugins in the same plugin module, and as such, it's impossible to know which plugin is associated with the migration script.
		// We could try to enforce the convention that the migration script is a subfolder of the schema folder of the plugin it is supposed to migrate.
		// But it's not certain you have the migration script, and besides, it's almost certain user won't respect this convention.
		// Finally, reading the migration script to determinate the kind of plugin is not that complicated, we have just a couple of rules to follow, and it's the most flexible way.
		pluginKind, err := GetPluginKind(migrateFilePath)
		if err != nil {
			return fmt.Errorf("unable to find the plugin kind associated to the migration file: %w", err)
		}
		schemas = append(schemas, schema.LoadSchema{
			Kind:     pluginKind,
			Instance: instance,
			Name:     currentPath,
		})
		return fs.SkipDir
	})
	return schemas, err
}

// isPackageMigrate is a function that checks if a cuelang file belongs to the package migrate.
// For that, we are opening the file and checking if the string "package migrate" is present.
func isPackageMigrate(file string) (bool, error) {
	data, err := os.ReadFile(file) //nolint: gosec
	if err != nil {
		return false, err
	}
	return strings.Contains(string(data), "package migrate"), nil
}

// GetPluginKind guesses the plugin kind from a migration file based on expected patterns
func GetPluginKind(migrateFile string) (plugin.Kind, error) {
	data, err := os.ReadFile(migrateFile) //nolint: gosec
	if err != nil {
		return "", err
	}
	if strings.Contains(string(data), grafanaType) {
		return plugin.KindPanel, nil
	}
	if strings.Contains(string(data), "#var.type") {
		return plugin.KindVariable, nil
	}
	return plugin.KindQuery, nil
}

// ExecuteCuelangScript executes a CUE migration script against grafana data
func ExecuteCuelangScript(cueScript *build.Instance, grafanaData []byte, defID string, typeOfDataToMigrate string) (*common.Plugin, bool, error) {
	ctx := cuecontext.New()
	grafanaValue := ctx.CompileString(fmt.Sprintf("%s: _", defID))
	grafanaValue = grafanaValue.FillPath(
		cue.ParsePath(defID),
		ctx.CompileBytes(grafanaData),
	)

	// Probably it is unnecessary to do that as JSON should be valid.
	// Otherwise, we won't be able to unmarshal the grafana dashboard.
	if err := grafanaValue.Validate(cue.Final()); err != nil {
		logrus.WithError(err).Trace("Unable to wrap the received json into a CUE definition")
		return nil, true, apiinterface.HandleBadRequestError(err.Error())
	}

	// Finally, unify the JSON files with the cue schema. Result should give only concrete value that can be marshaled in JSON.
	finalVal := grafanaValue.Unify(ctx.BuildInstance(cueScript))
	if err := finalVal.Err(); err != nil {
		logrus.WithError(err).Debugf("Unable to compile the migration schema for the %s", typeOfDataToMigrate)
		return nil, true, apiinterface.HandleBadRequestError(fmt.Sprintf("unable to convert to Perses %s: %s", typeOfDataToMigrate, err))
	}
	return convertToPlugin(finalVal)
}

// convertToPlugin converts a CUE value to a common.Plugin struct
func convertToPlugin(migrateValue cue.Value) (*common.Plugin, bool, error) {
	if migrateValue.IsNull() {
		return nil, true, nil
	}
	data, err := migrateValue.MarshalJSON()
	if err != nil {
		return nil, true, err
	}
	if string(data) == "" || string(data) == "{}" {
		return nil, true, nil
	}
	plg := &common.Plugin{}
	return plg, false, json.Unmarshal(data, plg)
}

type Migration interface {
	Load(pluginPath string, module v1.PluginModule) error
	LoadDevPlugin(pluginPath string, module v1.PluginModule) error
	UnLoadDevPlugin(module v1.PluginModule)
	Migrate(grafanaDashboard *SimplifiedDashboard) (*v1.Dashboard, error)
}

func New() Migration {
	return &completeMigration{
		mig: &mig{
			panels:    make(map[string]*panelInstance),
			variables: make(map[string]*build.Instance),
			queries:   make(map[string]*queryInstance),
		},
		devMig: &mig{
			panels:    make(map[string]*panelInstance),
			variables: make(map[string]*build.Instance),
			queries:   make(map[string]*queryInstance),
		},
	}
}

type completeMigration struct {
	Migration
	mig    *mig
	devMig *mig
	mutex  sync.RWMutex
}

func (m *completeMigration) Load(pluginPath string, module v1.PluginModule) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	return m.mig.load(pluginPath, module)
}

func (m *completeMigration) LoadDevPlugin(pluginPath string, module v1.PluginModule) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	return m.devMig.load(pluginPath, module)
}

func (m *completeMigration) UnLoadDevPlugin(module v1.PluginModule) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	for _, plg := range module.Spec.Plugins {
		m.devMig.remove(plg.Kind, plg.Spec.Name)
	}
}

func (m *completeMigration) Migrate(grafanaDashboard *SimplifiedDashboard) (*v1.Dashboard, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	result := &v1.Dashboard{
		Kind: v1.KindDashboard,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: grafanaDashboard.UID,
			},
		},
		Spec: v1.DashboardSpec{
			Display: &common.Display{
				Name: grafanaDashboard.Title,
			},
			Duration: common.Duration(time.Hour),
		},
	}

	panels, err := m.migratePanels(grafanaDashboard)
	if err != nil {
		return nil, err
	}
	result.Spec.Panels = panels
	result.Spec.Variables = m.migrateVariables(grafanaDashboard)
	result.Spec.Layouts = m.migrateGrid(grafanaDashboard)
	return result, nil
}

func (m *completeMigration) migrateGrid(grafanaDashboard *SimplifiedDashboard) []dashboard.Layout {
	var result []dashboard.Layout
	defaultSpec := &dashboard.GridLayoutSpec{}
	defaultLayout := dashboard.Layout{
		Kind: dashboard.KindGridLayout,
		Spec: defaultSpec,
	}

	result = append(result, defaultLayout)

	for i, panel := range grafanaDashboard.Panels {
		if panel.Type != grafanaPanelRowType {
			defaultSpec.Items = append(defaultSpec.Items, dashboard.GridItem{
				Width:  panel.GridPosition.Width,
				Height: panel.GridPosition.Height,
				X:      panel.GridPosition.X,
				Y:      panel.GridPosition.Y,
				Content: &common.JSONRef{
					Ref:  fmt.Sprintf("#/spec/panels/%d", i),
					Path: []string{"spec", "panels", fmt.Sprintf("%d", i)},
				},
			})
		} else {
			spec := &dashboard.GridLayoutSpec{
				Display: &dashboard.GridLayoutDisplay{
					Title: panel.Title,
					Collapse: &dashboard.GridLayoutCollapse{
						Open: !panel.Collapsed,
					},
				},
			}
			layout := dashboard.Layout{
				Kind: dashboard.KindGridLayout,
				Spec: spec,
			}
			for j, innerPanel := range panel.Panels {
				spec.Items = append(spec.Items, dashboard.GridItem{
					Width:  innerPanel.GridPosition.Width,
					Height: innerPanel.GridPosition.Height,
					X:      innerPanel.GridPosition.X,
					Y:      innerPanel.GridPosition.Y,
					Content: &common.JSONRef{
						Ref:  fmt.Sprintf("#/spec/panels/%d_%d", i, j),
						Path: []string{"spec", "panels", fmt.Sprintf("%d_%d", i, j)},
					},
				})
			}
			if len(spec.Items) > 0 {
				result = append(result, layout)
			}
		}
	}
	if len(defaultSpec.Items) == 0 {
		// Since there are no items, we should remove the default layout
		result = result[1:]
	}
	return result
}

type queryInstance struct {
	instance *build.Instance
	kind     plugin.Kind
}

type panelInstance struct {
	instance *build.Instance
	// name is the name of the panel plugin. Like TimeSeriesPanel, TablePanel, etc.
	name string
}

type mig struct {
	// panels is a map because we can decide which script to execute precisely.
	// This is because in Grafana a panel has a type.
	// The key is the Grafana type.
	panels map[string]*panelInstance
	// variables is a map that implies we won't allow having two migration scripts for the same variable type.
	// The key is the variable instance kind (e.g., PrometheusLabelValuesVariable).
	variables map[string]*build.Instance
	// queries is a map that implies we won't allow having two migration scripts for the same query type.
	// The key is the query instance kind (e.g., PrometheusTimeSeriesQuery).
	queries map[string]*queryInstance
}

func (m *mig) load(pluginPath string, module v1.PluginModule) error {
	schemas, err := Load(pluginPath, module.Spec)
	if err != nil {
		return err
	}
	for _, sch := range schemas {
		switch sch.Kind {
		case plugin.KindQuery:
			m.loadQuery(sch.Name, sch.Instance, module)
		case plugin.KindVariable:
			m.loadVariable(sch.Name, sch.Instance, module)
		case plugin.KindPanel:
			m.loadPanel(sch.Name, sch.Instance, module)
		}
	}
	return nil
}

func (m *mig) loadPanel(schemaPath string, instance *build.Instance, module v1.PluginModule) {
	ctx := cuecontext.New()
	panelSchema := ctx.BuildInstance(instance)
	kindValue := panelSchema.LookupPath(cue.ParsePath(grafanaType))
	grafanaKind := kindValue.Kind()

	// To be able to unregister the panel for the dev environment, we need to know the panel name associated.
	// So we are going to read again the migration script and find the `kind` value like for the other migration scripts. (a.k.a variable, queries).
	data, err := os.ReadFile(filepath.Join(schemaPath, "migrate.cue")) //nolint: gosec
	if err != nil {
		logrus.WithError(err).Warnf("unable to read migrate script from %q", schemaPath)
		return
	}
	var panelKindName string
	for _, group := range kindRegexp.FindAllStringSubmatch(string(data), -1) {
		if len(group) < 2 {
			continue
		}
		k := group[1]
		for _, plg := range module.Spec.Plugins {
			if plg.Spec.Name == k {
				panelKindName = k
				break
			}
		}
	}
	if len(panelKindName) == 0 {
		logrus.Warningf("unable to recognize the panel kind from the migrate script %q", schemaPath)
		return
	}
	pInstance := &panelInstance{
		instance: instance,
		name:     panelKindName,
	}

	// Kind can be a simple string or a disjunction of strings. Like #grafanaType: "table" | "table-old"
	if grafanaKind == cue.StringKind {
		kindAsString, _ := kindValue.String()
		m.panels[kindAsString] = pInstance
	} else if grafanaKind == cue.BottomKind && kindValue.IncompleteKind() == cue.StringKind {
		op, values := kindValue.Expr()
		if op != cue.AndOp && op != cue.OrOp {
			logrus.Infof("unable to load migrate script from plugin %q: op in field %q not recognised", schemaPath, grafanaType)
			return
		}
		for _, value := range values {
			if value.Kind() != cue.StringKind {
				logrus.Tracef("in plugin %q value not decoded as it is of type %q ", schemaPath, value.Kind())
				continue
			}
			valueAsString, _ := value.String()
			m.panels[valueAsString] = pInstance
		}
	}
}

func (m *mig) loadVariable(schemaPath string, instance *build.Instance, module v1.PluginModule) {
	// The idea here is to know the variable instance name we are dealing with.
	// There is no particular purpose to have the variable instance name for the migration itself.
	// The goal here is more to ensure we have a single migration script per variable kind.
	// It will help on a higher level when we load a plugin from the dev environment because the migration script will need to override the existing one.
	data, err := os.ReadFile(filepath.Join(schemaPath, "migrate.cue")) //nolint: gosec
	if err != nil {
		logrus.WithError(err).Warnf("unable to read migrate script from %q", schemaPath)
	}
	for _, group := range kindRegexp.FindAllStringSubmatch(string(data), -1) {
		if len(group) < 2 {
			continue
		}
		kind := group[1]
		for _, plg := range module.Spec.Plugins {
			if plg.Spec.Name == kind {
				m.variables[kind] = instance
				return
			}
		}
	}
	logrus.Infof("unable to reconize the variable kind from the migrate script %q", schemaPath)
}

func (m *mig) loadQuery(schemaPath string, instance *build.Instance, module v1.PluginModule) {
	// The idea here is to know the query instance name we are dealing with.
	// Then based on that, we will loop other the plugins listed in the module to get the high level query kind.
	// It will be useful to know which query plugin to use when migrating the Grafana dashboard.
	data, err := os.ReadFile(filepath.Join(schemaPath, "migrate.cue")) //nolint: gosec
	if err != nil {
		logrus.WithError(err).Warnf("unable to read migrate script from %q", schemaPath)
	}
	for _, group := range kindRegexp.FindAllStringSubmatch(string(data), -1) {
		if len(group) < 2 {
			continue
		}
		kind := group[1]
		for _, plg := range module.Spec.Plugins {
			if plg.Spec.Name == kind {
				m.queries[kind] = &queryInstance{
					instance: instance,
					kind:     plg.Kind,
				}
				return
			}
		}
	}
	logrus.Infof("unable to reconize the query kind from the migrate script %q", schemaPath)
}

func (m *mig) remove(kind plugin.Kind, name string) {
	if kind.IsQuery() {
		delete(m.queries, name)
	} else {
		switch kind {
		case plugin.KindPanel:
			for grafanaKindName, p := range m.panels {
				if p.name == name {
					delete(m.panels, grafanaKindName)
					// When parsing the migration script, it's possible we are finding that the script can match multiple Grafana panel types.
					// So we need to remove all the entries that match the panel name.
					// That's why; when finding one, we are not breaking the loop.
				}
			}
			delete(m.panels, name)
		case plugin.KindVariable:
			delete(m.variables, name)
		case plugin.KindDatasource:
			// No migration script for datasource, so nothing to remove
		default:
			logrus.Warnf("unable to remove migration script for %q: kind %q not supported", name, kind)
		}
	}
}

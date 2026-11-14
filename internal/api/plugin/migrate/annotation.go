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

package migrate

import (
	"maps"
	"slices"

	"cuelang.org/go/cue/build"
	"github.com/perses/spec/go/dashboard"
	"github.com/perses/spec/go/plugin"
	"github.com/sirupsen/logrus"
)

// grafanaColors maps the names of the colors of the Grafana palette to their hexadecimal value.
// Other colors (hexadecimal, rgb(), CSS names) are kept as they are.
// The values come from the Grafana palette (createVisualizationColors.ts in the Grafana repository).
var grafanaColors = map[string]string{
	"dark-red":           "#c4162a",
	"semi-dark-red":      "#e02f44",
	"red":                "#f2495c",
	"light-red":          "#ff7383",
	"super-light-red":    "#ffa6b0",
	"dark-orange":        "#fa6400",
	"semi-dark-orange":   "#ff780a",
	"orange":             "#ff9830",
	"light-orange":       "#ffb357",
	"super-light-orange": "#ffcb7d",
	"dark-green":         "#37872d",
	"semi-dark-green":    "#56a64b",
	"green":              "#73bf69",
	"light-green":        "#96d98d",
	"super-light-green":  "#c8f2c2",
	"dark-blue":          "#1f60c4",
	"semi-dark-blue":     "#3274d9",
	"blue":               "#5794f2",
	"light-blue":         "#8ab8ff",
	"super-light-blue":   "#c0d8ff",
	"dark-purple":        "#8f3bb8",
	"semi-dark-purple":   "#a352cc",
	"purple":             "#b877d9",
	"light-purple":       "#ca95e5",
	"super-light-purple": "#deb6f2",
	"dark-yellow":        "#e0b400",
	"semi-dark-yellow":   "#f2cc0c",
	"yellow":             "#fade2a",
	"light-yellow":       "#ffee52",
	"super-light-yellow": "#fff899",
	"transparent":        "#00000000",
}

func migrateAnnotationColor(iconColor string) string {
	if color, ok := grafanaColors[iconColor]; ok {
		return color
	}
	return iconColor
}

func (m *completeMigration) migrateAnnotations(grafanaDashboard *SimplifiedDashboard, useDefaultDatasource bool) []dashboard.AnnotationSpec {
	var result []dashboard.AnnotationSpec
	// The Perses UI identifies an annotation by its name, so only the first annotation with a given name is kept.
	names := make(map[string]struct{})
	for _, a := range grafanaDashboard.Annotations.List {
		// The built-in annotation queries the annotations and alerts stored by Grafana, which have no equivalent in Perses.
		if a.BuiltIn == 1 {
			continue
		}
		// A Perses annotation requires a name.
		if len(a.Name) == 0 {
			logrus.Debug("annotation without name skipped during the migration")
			continue
		}
		if _, ok := names[a.Name]; ok {
			logrus.Debugf("annotation %q skipped during the migration, as another annotation already has this name", a.Name)
			continue
		}
		// Unlike for the variables and the panels, there is no placeholder plugin for an annotation that can't be migrated:
		// such an annotation is not kept, as it would only fail or display nothing.
		annotationPlugin := migrateAnnotation(m.devMig.annotations, a)
		if annotationPlugin == nil {
			annotationPlugin = migrateAnnotation(m.mig.annotations, a)
		}
		if annotationPlugin == nil {
			logrus.Debugf("no migration script matches the annotation %q, so it is not migrated", a.Name)
			continue
		}
		names[a.Name] = struct{}{}
		if useDefaultDatasource {
			removeDatasourceName(annotationPlugin)
		}
		result = append(result, dashboard.AnnotationSpec{
			Display: dashboard.AnnotationDisplay{
				Name: a.Name,
				// A hidden Perses annotation is not fetched, like a Grafana annotation that is not enabled.
				Hidden: a.Enable != nil && !*a.Enable,
				Color:  migrateAnnotationColor(a.IconColor),
			},
			Plugin: *annotationPlugin,
		})
	}
	return result
}

func migrateAnnotation(annotationInstances map[string]*build.Instance, a GrafanaAnnotation) *plugin.Plugin {
	// Like for the variables, nothing in the Grafana annotation indicates which migration script to use.
	// So we execute all of them, in a stable order, and keep the first one that returns a non-empty plugin.
	for _, kind := range slices.Sorted(maps.Keys(annotationInstances)) {
		annotationPlugin, isEmpty, err := ExecuteAnnotationScript(annotationInstances[kind], a.RawMessage)
		if err != nil {
			logrus.WithError(err).Debug("failed to execute annotation migration script")
			continue
		}
		if !isEmpty {
			return annotationPlugin
		}
	}
	return nil
}

// removeDatasourceName removes the explicit datasource reference of the plugin, so it uses the default datasource.
func removeDatasourceName(plg *plugin.Plugin) {
	if pluginSpec, ok := plg.Spec.(map[string]any); ok {
		if datasourceRef, ok := pluginSpec["datasource"].(map[string]any); ok {
			delete(datasourceRef, "name")
		}
	}
}

func ExecuteAnnotationScript(cueScript *build.Instance, grafanaAnnotationData []byte) (*plugin.Plugin, bool, error) {
	return executeCuelangScript(cueScript, grafanaAnnotationData, annotationDefID, "annotation")
}

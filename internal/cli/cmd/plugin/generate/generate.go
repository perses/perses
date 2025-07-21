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

package generate

import (
	"fmt"
	"io"
	"log"
	"os"
	"path"
	"path/filepath"
	"slices"
	"strings"
	"text/template"

	plugin "github.com/perses/perses/internal/api/plugin"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/output"
	common "github.com/perses/perses/pkg/model/api/v1/common"
	apiv1 "github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/spf13/cobra"
)

type generateOptions struct {
	persesCMD.Option
	pluginModuleName  string
	pluginModuleOrg   string
	pluginType        string
	pluginName        string
	pluginPascalName  string
	pluginDisplayName string
	outputDir         string
	writer            io.Writer
	errWriter         io.Writer
}

type ExposedModule struct {
	ID   string
	Path string
}

type GeneratedPlugin struct {
	apiv1.Plugin
	PluginPascalName string
}

func toGeneratedPlugin(p apiv1.Plugin) GeneratedPlugin {
	return GeneratedPlugin{
		Plugin:           p,
		PluginPascalName: GetPascalCase(p.Spec.Name),
	}
}

func (o *generateOptions) Complete(args []string) error {
	if len(args) > 0 {
		o.outputDir = args[0]
	} else {
		o.outputDir = "."
	}

	return nil
}

var availablePluginTypes = []string{
	"Datasource",
	"TimeSeriesQuery",
	"Variable",
	"Panel",
	"Explore",
}

func (o *generateOptions) Validate() error {
	destDir, err := filepath.Abs(o.outputDir)
	if err != nil {
		return fmt.Errorf("could not resolve destination directory path %q: %w", o.pluginModuleName, err)
	}

	if _, err := os.Stat(destDir); os.IsNotExist(err) {
		return fmt.Errorf("destination directory %q does not exists", destDir)
	}

	o.outputDir = destDir

	if o.pluginName == "" || o.pluginType == "" {
		return fmt.Errorf("plugin.name and plugin.type are required")
	}

	if !slices.Contains(availablePluginTypes, o.pluginType) {
		return fmt.Errorf("plugin.type %q is not valid, possible values are: %s", o.pluginType, strings.Join(availablePluginTypes, ", "))
	}

	o.pluginName = GetKebabCase(o.pluginName)
	o.pluginPascalName = GetPascalCase(o.pluginName)

	if o.pluginDisplayName == "" {
		o.pluginDisplayName = o.pluginPascalName
	}

	return nil
}

func replacePaths(outputRelativePath string, o *generateOptions) string {
	outputRelativePath = strings.ReplaceAll(outputRelativePath, "plugin_name__", o.pluginName)
	outputRelativePath = strings.ReplaceAll(outputRelativePath, "plugin_pascal_name__", o.pluginPascalName)

	return outputRelativePath
}

func getPluginPath(pluginName string, pluginType string) (string, error) {
	pluginSlug := GetKebabCase(pluginName)
	switch pluginType {
	case "Datasource":
		return path.Join("src", "datasources", pluginSlug), nil
	case "TimeSeriesQuery":
		return path.Join("src", "queries", pluginSlug), nil
	case "Variable":
		return path.Join("src", "variables", pluginSlug), nil
	case "Panel":
		return path.Join("src", "panels", pluginSlug), nil
	case "Explore":
		return path.Join("src", "explore", pluginSlug), nil
	}

	return "", fmt.Errorf("unknown plugin type %q", pluginType)
}

func getTemplatePath(pluginType string) (string, error) {
	switch pluginType {
	case "Datasource":
		return path.Join("templates", "datasource"), nil
	case "TimeSeriesQuery":
		return path.Join("templates", "query", "timeseriesquery"), nil
	case "Variable":
		return path.Join("templates", "variable"), nil
	case "Panel":
		return path.Join("templates", "panel"), nil
	case "Explore":
		return path.Join("templates", "explore"), nil
	}

	return "", fmt.Errorf("unknown plugin type %q", pluginType)
}

func (o *generateOptions) Execute() error {
	var err error

	moduleDir := path.Join("templates", "module")
	blocksDir := path.Join("templates", "blocks")

	isModuleGeneration := false

	persesPlugins := []GeneratedPlugin{}
	persesPanelPlugins := []GeneratedPlugin{}
	persesDatasourcePlugins := []GeneratedPlugin{}
	persesQueryPlugins := []GeneratedPlugin{}
	persesVariablePlugins := []GeneratedPlugin{}
	persesExplorePlugins := []GeneratedPlugin{}
	exposedModules := []ExposedModule{}

	currentModule, err := plugin.ReadPackage(o.outputDir)
	currentPlugins := []apiv1.Plugin{}

	if err != nil || currentModule == nil {
		if err != nil && os.IsNotExist(err) {
			if o.pluginModuleName == "" || o.pluginModuleOrg == "" {
				return fmt.Errorf("module.name and module.org are required when creating a new module as none was found under %q", o.outputDir)
			}
		} else {
			return fmt.Errorf("could not read module from %q: %w", o.outputDir, err)
		}

		log.Printf("No perses plugin module found under %q, creating a new one", o.outputDir)
		isModuleGeneration = true
	} else {
		o.pluginModuleName = currentModule.Perses.ModuleName
		o.pluginModuleOrg = currentModule.Perses.ModuleOrg
		currentPlugins = currentModule.Perses.Plugins
	}

	// merge existing plugins and exposed modules with the one being generated
	for _, p := range currentPlugins {
		if GetKebabCase(p.Spec.Name) != GetKebabCase(o.pluginName) {
			persesPlugins = append(persesPlugins, toGeneratedPlugin(p))

			path, err := getPluginPath(p.Spec.Name, string(p.Kind))
			if err != nil {
				return fmt.Errorf("could not get existing plugin path %q: %w", o.pluginName, err)
			}

			exposedModules = append(exposedModules, ExposedModule{
				ID:   GetPascalCase(p.Spec.Name),
				Path: path,
			})
		}
	}

	persesPlugins = append(persesPlugins, toGeneratedPlugin(apiv1.Plugin{
		Kind: apiv1.Kind(o.pluginType),
		Spec: apiv1.Spec{
			Display: &common.Display{
				Name: o.pluginDisplayName,
			},
			Name: o.pluginName,
		},
	}))

	pluginPath, err := getPluginPath(o.pluginName, o.pluginType)
	if err != nil {
		return fmt.Errorf("could not get plugin path %q: %w", o.pluginName, err)
	}

	exposedModules = append(exposedModules, ExposedModule{
		ID:   GetPascalCase(o.pluginName),
		Path: pluginPath,
	})

	for _, p := range persesPlugins {
		if p.Kind.IsQuery() {
			persesQueryPlugins = append(persesQueryPlugins, p)
		} else {
			switch p.Kind {
			case apiv1.KindDatasource:
				persesDatasourcePlugins = append(persesDatasourcePlugins, p)
			case apiv1.KindVariable:
				persesVariablePlugins = append(persesVariablePlugins, p)
			case apiv1.KindExplore:
				persesExplorePlugins = append(persesExplorePlugins, p)
			case apiv1.KindPanel:
				persesPanelPlugins = append(persesPanelPlugins, p)
			}
		}
	}

	data := map[string]interface{}{
		"ModuleName":              GetKebabCase(o.pluginModuleName),
		"ModulePascalName":        GetPascalCase(o.pluginModuleName),
		"ModuleOrg":               GetKebabCase(o.pluginModuleOrg),
		"PluginName":              GetKebabCase(o.pluginName),
		"PluginPascalName":        o.pluginPascalName,
		"ExposedModules":          exposedModules,
		"PersesPlugins":           persesPlugins,
		"PersesPanelPlugins":      persesPanelPlugins,
		"PersesDatasourcePlugins": persesDatasourcePlugins,
		"PersesQueryPlugins":      persesQueryPlugins,
		"PersesVariablePlugins":   persesVariablePlugins,
		"PersesExplorePlugins":    persesExplorePlugins,
	}

	var moduleTemplateFiles []string
	templateSet := template.New("root")

	moduleTemplateFiles, err = CollectTemplatePaths(moduleDir, templateSet)
	if err != nil {
		log.Fatalf("error walking module template directory: %v", err)
	}

	blocksTemplateFiles, err := CollectTemplatePaths(blocksDir, templateSet)
	if err != nil {
		log.Fatalf("error walking blocks template directory: %v", err)
	}

	srcDir, err := getTemplatePath(o.pluginType)
	if err != nil {
		return fmt.Errorf("could not get template path %q: %w", o.pluginType, err)
	}

	pluginTypeTemplateFiles, err := CollectTemplatePaths(srcDir, templateSet)
	if err != nil {
		log.Fatalf("error walking plugin type template directory: %v", err)
	}

	allTemplateFiles := append(append(moduleTemplateFiles, blocksTemplateFiles...), pluginTypeTemplateFiles...)

	createdPaths := []string{}

	for _, relTemplatePath := range allTemplateFiles {
		outputRelativePath := strings.TrimSuffix(relTemplatePath, tmplExt)

		// Skip blocks templates from generating files, excluding the LICENSE file
		if filepath.Ext(outputRelativePath) == "" && !strings.HasSuffix(outputRelativePath, "LICENSE") {
			continue
		}

		// Replace paths to create files with plugin names
		outputRelativePath = replacePaths(outputRelativePath, o)

		outputFullPath := filepath.Clean(path.Join(o.outputDir, outputRelativePath))

		outputDir := filepath.Dir(outputFullPath)
		if err := os.MkdirAll(outputDir, 0750); err != nil {
			return fmt.Errorf("error creating output directory '%s': %v. Skipping template '%s'", outputDir, err, relTemplatePath)
		}

		outputFile, err := os.Create(outputFullPath)
		if err != nil {
			return fmt.Errorf("error creating output file '%s': %v. Skipping template '%s'", outputFullPath, err, relTemplatePath)
		}
		defer outputFile.Close() //nolint:errcheck

		err = templateSet.ExecuteTemplate(outputFile, relTemplatePath, data)
		if err != nil {
			return fmt.Errorf("error executing template '%s' to file '%s': %v", relTemplatePath, outputFullPath, err)
		}

		createdPaths = append(createdPaths, outputRelativePath)
	}

	msg := fmt.Sprintf("plugin %s generated successfully", o.pluginPascalName)
	if isModuleGeneration {
		msg = fmt.Sprintf("module %s created successfully, %s", o.pluginModuleName, msg)
	}

	for _, path := range createdPaths {
		msg += fmt.Sprintf("\n- %s", path)
	}

	return output.HandleString(o.writer, msg)
}

func (o *generateOptions) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *generateOptions) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

func NewCMD() *cobra.Command {
	o := &generateOptions{}
	cmd := &cobra.Command{
		Use:   "generate [<output-directory>]",
		Short: "Generate a plugin module or plugin type",
		Long: `
Creates a new plugin module if does not exist and generates a plugin inside it. 
This command can be used several times to add more plugins to the same module. 
A single plugin can be generated at a time.
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar(&o.pluginModuleName, "module.name", "", "The plugin module name, required only when the module does not exist, ignored otherwise.")
	cmd.Flags().StringVar(&o.pluginModuleOrg, "module.org", "", "The organization name on which the plugin module will be created, useful for publising the plugin. This is required only when the module does not exist, ignored otherwise.")
	cmd.Flags().StringVar(&o.pluginName, "plugin.name", "", "The plugin name. A pascal case and kebab case variants will be generated inside the templates. If a plugin with the same name already exists, it will be overwritten.")
	cmd.Flags().StringVar(&o.pluginDisplayName, "plugin.display-name", "", "The more human name of the plugin to be used in the UI. If not provided, the plugin name will be used.")
	cmd.Flags().StringVar(&o.pluginType, "plugin.type", "", "The plugin type can be one of 'Datasource', 'TimeSeriesQuery', 'Variable', 'Panel', or 'Explore'.")

	return cmd
}

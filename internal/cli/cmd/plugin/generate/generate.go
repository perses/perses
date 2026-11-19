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

package generate

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"go/token"
	"io"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"runtime/debug"
	"slices"
	"strings"
	"text/template"

	"github.com/perses/perses/internal/api/plugin"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/spec/go/common"
	"github.com/perses/spec/go/module"
	pluginSpec "github.com/perses/spec/go/plugin"
	"github.com/prometheus/common/version"
	"github.com/spf13/cobra"
	"golang.org/x/mod/modfile"
	gomodule "golang.org/x/mod/module"
	"golang.org/x/mod/semver"
)

// persesModulePath is the Go module that provides the Dashboard-as-Code builders used by the generated Go SDK.
const persesModulePath = "github.com/perses/perses"

// latestVersion is the module query that resolves to the latest release, used when percli has no release version.
const latestVersion = "latest"

// goRunner runs the go command with the given arguments in dir and returns its combined output.
type goRunner func(ctx context.Context, dir string, args ...string) ([]byte, error)

func runGo(ctx context.Context, dir string, args ...string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, "go", args...) //nolint:gosec // the arguments are passed straight to exec, no shell is involved
	cmd.Dir = dir
	return cmd.CombinedOutput()
}

type generateOptions struct {
	persesCMD.Option
	pluginModuleName  string
	pluginModuleOrg   string
	pluginType        pluginSpec.Kind
	rawPluginType     string
	pluginName        string
	pluginPascalName  string
	pluginDisplayName string
	outputDir         string
	// goModuleMissing is true when the output directory has no go.mod yet, so one has to be created.
	goModuleMissing bool
	// persesVersion is the version of the perses module the Go SDK is generated for.
	persesVersion string
	runGo         goRunner
	ctx           context.Context
	writer        io.Writer
	errWriter     io.Writer
}

type ExposedModule struct {
	ID   string
	Path string
}

type GeneratedPlugin struct {
	module.Plugin
	PluginPascalName string
}

func toGeneratedPlugin(p module.Plugin) GeneratedPlugin {
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

	if len(o.rawPluginType) > 0 {
		o.pluginType = pluginSpec.Kind(o.rawPluginType)
	}

	return nil
}

var availablePluginTypes = []pluginSpec.Kind{
	pluginSpec.KindDatasource,
	pluginSpec.KindTimeSeriesQuery,
	pluginSpec.KindVariable,
	pluginSpec.KindAnnotation,
	pluginSpec.KindPanel,
	pluginSpec.KindExplore,
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
		return fmt.Errorf("plugin.type %q is not valid, possible values are: %s", o.pluginType, availablePluginTypes)
	}

	if err := o.checkGoModuleRequirements(); err != nil {
		return err
	}

	o.pluginName = GetKebabCase(o.pluginName)
	o.pluginPascalName = GetPascalCase(o.pluginName)

	if o.pluginDisplayName == "" {
		o.pluginDisplayName = o.pluginPascalName
	}

	if slices.Contains(pluginTypesWithGoSDK, o.pluginType) {
		if err := validateGoSDKName(o.pluginType, o.pluginName, o.pluginPascalName); err != nil {
			return err
		}
		persesVersion, err := persesModuleVersion(version.Version, buildInfoVersion())
		if err != nil {
			return err
		}
		o.persesVersion = persesVersion
	}

	return nil
}

func replacePaths(outputRelativePath string, o *generateOptions) string {
	outputRelativePath = strings.ReplaceAll(outputRelativePath, "plugin_name__", o.pluginName)
	outputRelativePath = strings.ReplaceAll(outputRelativePath, "plugin_pascal_name__", o.pluginPascalName)

	return outputRelativePath
}

func getPluginPath(pluginName string, pluginType pluginSpec.Kind) (string, error) {
	pluginSlug := GetKebabCase(pluginName)
	switch pluginType {
	case pluginSpec.KindDatasource:
		return path.Join("src", "datasources", pluginSlug), nil
	case pluginSpec.KindTimeSeriesQuery:
		return path.Join("src", "queries", pluginSlug), nil
	case pluginSpec.KindVariable:
		return path.Join("src", "variables", pluginSlug), nil
	case pluginSpec.KindAnnotation:
		return path.Join("src", "annotations", pluginSlug), nil
	case pluginSpec.KindPanel:
		return path.Join("src", "panels", pluginSlug), nil
	case pluginSpec.KindExplore:
		return path.Join("src", "explore", pluginSlug), nil
	}

	return "", fmt.Errorf("unknown plugin type %q", pluginType)
}

func getTemplatePath(pluginType pluginSpec.Kind) (string, error) {
	switch pluginType {
	case pluginSpec.KindDatasource:
		return path.Join("templates", "datasource"), nil
	case pluginSpec.KindTimeSeriesQuery:
		return path.Join("templates", "query", "timeseriesquery"), nil
	case pluginSpec.KindVariable:
		return path.Join("templates", "variable"), nil
	case pluginSpec.KindAnnotation:
		return path.Join("templates", "annotations"), nil
	case pluginSpec.KindPanel:
		return path.Join("templates", "panel"), nil
	case pluginSpec.KindExplore:
		return path.Join("templates", "explore"), nil
	}

	return "", fmt.Errorf("unknown plugin type %q", pluginType)
}

// pluginsByKind holds the plugins of a module split by kind, so the templates can list them separately.
type pluginsByKind struct {
	panels      []GeneratedPlugin
	datasources []GeneratedPlugin
	queries     []GeneratedPlugin
	variables   []GeneratedPlugin
	annotations []GeneratedPlugin
	explores    []GeneratedPlugin
}

func groupPluginsByKind(plugins []GeneratedPlugin) pluginsByKind {
	var groups pluginsByKind
	for _, p := range plugins {
		if p.Kind.IsQuery() {
			groups.queries = append(groups.queries, p)
			continue
		}
		switch p.Kind {
		case pluginSpec.KindDatasource:
			groups.datasources = append(groups.datasources, p)
		case pluginSpec.KindVariable:
			groups.variables = append(groups.variables, p)
		case pluginSpec.KindAnnotation:
			groups.annotations = append(groups.annotations, p)
		case pluginSpec.KindExplore:
			groups.explores = append(groups.explores, p)
		case pluginSpec.KindPanel:
			groups.panels = append(groups.panels, p)
		}
	}
	return groups
}

func (o *generateOptions) Execute() error {
	var err error

	moduleDir := path.Join("templates", "module")
	blocksDir := path.Join("templates", "blocks")

	isModuleGeneration := false

	var persesPlugins []GeneratedPlugin
	var exposedModules []ExposedModule

	currentModule, err := plugin.ReadPackage(o.outputDir)
	var currentPlugins []module.Plugin

	if err != nil || currentModule == nil {
		if err != nil && errors.Is(err, os.ErrNotExist) {
			if o.pluginModuleName == "" || o.pluginModuleOrg == "" {
				return fmt.Errorf("module.name and module.org are required when creating a new module as none was found under %q", o.outputDir)
			}
		} else {
			return fmt.Errorf("could not read module from %q: %w", o.outputDir, err)
		}

		log.Printf("No perses plugin module found under %q, creating a new one", o.outputDir)
		isModuleGeneration = true
	} else {
		o.pluginModuleName = currentModule.Perses.Metadata.Name
		o.pluginModuleOrg = currentModule.Perses.Metadata.Registry
		currentPlugins = currentModule.Perses.Plugins
	}

	// merge existing plugins and exposed modules with the one being generated
	for _, p := range currentPlugins {
		if GetKebabCase(p.Spec.Name) != GetKebabCase(o.pluginName) {
			persesPlugins = append(persesPlugins, toGeneratedPlugin(p))

			pluginPath, errPath := getPluginPath(p.Spec.Name, p.Kind)
			if errPath != nil {
				return fmt.Errorf("could not get existing plugin path %q: %w", o.pluginName, errPath)
			}

			exposedModules = append(exposedModules, ExposedModule{
				ID:   GetPascalCase(p.Spec.Name),
				Path: pluginPath,
			})
		}
	}

	goModulePath, err := o.goModulePath()
	if err != nil {
		return err
	}

	persesPlugins = append(persesPlugins, toGeneratedPlugin(module.Plugin{
		Kind: o.pluginType,
		Spec: module.PluginSpec{
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

	groups := groupPluginsByKind(persesPlugins)

	data := map[string]any{
		"ModuleName":               GetKebabCase(o.pluginModuleName),
		"ModulePascalName":         GetPascalCase(o.pluginModuleName),
		"ModuleOrg":                GetKebabCase(o.pluginModuleOrg),
		"PluginName":               GetKebabCase(o.pluginName),
		"PluginPascalName":         o.pluginPascalName,
		"PluginGoPackage":          GetGoPackageName(o.pluginName),
		"ExposedModules":           exposedModules,
		"PersesPlugins":            persesPlugins,
		"PersesPanelPlugins":       groups.panels,
		"PersesDatasourcePlugins":  groups.datasources,
		"PersesQueryPlugins":       groups.queries,
		"PersesVariablePlugins":    groups.variables,
		"PersesAnnotationsPlugins": groups.annotations,
		"PersesExplorePlugins":     groups.explores,
	}

	var moduleTemplateFiles []string
	templateSet := template.New("root")

	moduleTemplateFiles, err = CollectTemplatePaths(moduleDir, templateSet)
	if err != nil {
		return fmt.Errorf("error walking module template directory: %w", err)
	}

	blocksTemplateFiles, err := CollectTemplatePaths(blocksDir, templateSet)
	if err != nil {
		return fmt.Errorf("error walking blocks template directory: %w", err)
	}

	srcDir, err := getTemplatePath(o.pluginType)
	if err != nil {
		return fmt.Errorf("could not get template path %q: %w", o.pluginType, err)
	}

	pluginTypeTemplateFiles, err := CollectTemplatePaths(srcDir, templateSet)
	if err != nil {
		return fmt.Errorf("error walking plugin type template directory: %w", err)
	}

	allTemplateFiles := append(append(moduleTemplateFiles, blocksTemplateFiles...), pluginTypeTemplateFiles...)

	var createdPaths []string
	generatedGoSources := false

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
		if filepath.Ext(outputRelativePath) == ".go" {
			generatedGoSources = true
		}
	}

	goModPaths, err := o.ensureGoModule(goModulePath, generatedGoSources)
	if err != nil {
		return err
	}
	createdPaths = append(createdPaths, goModPaths...)

	return output.HandleString(o.writer, o.successMessage(isModuleGeneration, createdPaths))
}

// successMessage lists the files created or changed by the generation.
func (o *generateOptions) successMessage(isModuleGeneration bool, createdPaths []string) string {
	msg := fmt.Sprintf("plugin %s generated successfully", o.pluginPascalName)
	if isModuleGeneration {
		msg = fmt.Sprintf("module %s created successfully, %s", o.pluginModuleName, msg)
	}

	for _, p := range createdPaths {
		msg += fmt.Sprintf("\n- %s", p)
	}

	return msg
}

// pluginTypesWithGoSDK are the plugin types whose templates include a Go SDK for Dashboard-as-Code.
var pluginTypesWithGoSDK = []pluginSpec.Kind{
	pluginSpec.KindDatasource,
	pluginSpec.KindTimeSeriesQuery,
	pluginSpec.KindAnnotation,
	pluginSpec.KindPanel,
}

// goSDKDeclarations are the exported identifiers that the Go SDK template of each plugin type declares next to the
// constructor named after the plugin, so a plugin can't be named after one of them.
//
//nolint:goconst // the identifiers each template declares, listed as they appear in it
var goSDKDeclarations = map[pluginSpec.Kind][]string{
	pluginSpec.KindDatasource: {"PluginKind", "Option", "Builder", "Selector", "DirectURL", "HTTPProxy"},
	pluginSpec.KindTimeSeriesQuery: {"PluginKind", "DatasourceKind", "PluginSpec", "Option", "Builder", "Expr",
		"Datasource"},
	pluginSpec.KindAnnotation: {"PluginKind", "PluginSpec", "Option", "Builder", "Expr", "Datasource", "Title", "Legend",
		"Tags"},
	pluginSpec.KindPanel: {"PluginKind", "LegendPosition", "BottomPosition", "RightPosition", "LegendMode", "ListMode",
		"TableMode", "LegendSize", "SmallSize", "MediumSize", "Legend", "ColorMode", "FixedColorMode",
		"FixedSingleColorMode", "QuerySettings", "PluginSpec", "Option", "Builder", "WithLegend", "WithThresholds",
		"WithQuerySettings"},
}

// goSDKNamePattern matches the kebab-cased plugin names the Go SDK can use, since they name the directory and the
// file of its package: ASCII only, as in an import path, and no underscore, as go ignores a name starting with one
// and a suffix like _test, _linux or _amd64 makes a test or a platform-specific file.
var goSDKNamePattern = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

// validateGoSDKName checks that the Go SDK generated for the plugin compiles: the package name derived from the
// plugin name must be a valid one, and the constructor named after the plugin must not collide with the other
// declarations of the template.
func validateGoSDKName(pluginType pluginSpec.Kind, pluginName, pluginPascalName string) error {
	pkg := GetGoPackageName(pluginName)
	if !token.IsIdentifier(pkg) || pkg == "main" {
		return fmt.Errorf("plugin.name %q can't be used for the Go SDK, as %q isn't a valid Go package name: "+
			"use a name that starts with a letter and isn't a Go keyword or main", pluginName, pkg)
	}
	if !token.IsIdentifier(pluginPascalName) {
		return fmt.Errorf("plugin.name %q can't be used for the Go SDK, as %q isn't a valid Go identifier", pluginName, pluginPascalName)
	}
	if !goSDKNamePattern.MatchString(pluginName) {
		return fmt.Errorf("plugin.name %q can't be used for the Go SDK, as it names the directory and the file of its "+
			"package: use ASCII letters, digits, spaces or dashes", pluginName)
	}
	if slices.Contains(goSDKDeclarations[pluginType], pluginPascalName) {
		return fmt.Errorf("plugin.name %q can't be used for the %s plugin type, as its Go SDK already declares %s: use another name",
			pluginName, pluginType, pluginPascalName)
	}
	return nil
}

// checkGoModuleRequirements records whether the output directory needs a go.mod and, if it does or the plugin type
// generates a Go SDK, checks that the go binary is available. It runs before anything is written, so the command
// doesn't leave a half-generated module behind.
func (o *generateOptions) checkGoModuleRequirements() error {
	goModExists, err := file.Exists(filepath.Join(o.outputDir, "go.mod"))
	if err != nil {
		return fmt.Errorf("could not check for an existing go.mod under %q: %w", o.outputDir, err)
	}

	o.goModuleMissing = !goModExists
	if !o.goModuleMissing && !slices.Contains(pluginTypesWithGoSDK, o.pluginType) {
		return nil
	}

	if _, err := exec.LookPath("go"); err != nil {
		return fmt.Errorf("the go binary is required to initialize the Go module and resolve the Go SDK dependencies but was not found in PATH: %w", err)
	}

	return nil
}

// goModulePath returns the path of the Go module to initialize, or an empty string when the output directory
// already has a go.mod. It fails when the module org or name is empty, since `go mod init` would reject the path.
func (o *generateOptions) goModulePath() (string, error) {
	if !o.goModuleMissing {
		return "", nil
	}

	org := GetKebabCase(o.pluginModuleOrg)
	name := GetKebabCase(o.pluginModuleName)

	if org == "" || name == "" {
		return "", fmt.Errorf("the module org and name are required to initialize the Go module under %q, "+
			"set the registry and the name of the module in its package.json or pass --module.org and --module.name", o.outputDir)
	}

	return fmt.Sprintf("github.com/%s/%s", org, name), nil
}

// buildInfoVersion returns the version of the main module of this binary, which `go install` sets to the installed
// version.
func buildInfoVersion() string {
	info, ok := debug.ReadBuildInfo()
	if !ok {
		return ""
	}
	return info.Main.Version
}

// persesModuleVersion returns the version of the perses module that matches the Go SDK templates of this percli
// build. buildVersion is the version set with -ldflags, and moduleVersion the version from the build info, used for
// a binary installed with `go install`. A development build, a pseudo-version or a modified checkout gets "latest".
func persesModuleVersion(buildVersion, moduleVersion string) (string, error) {
	if buildVersion != "" {
		v := "v" + strings.TrimPrefix(buildVersion, "v")
		if !semver.IsValid(v) {
			return "", fmt.Errorf("the percli version %q isn't a valid semantic version, so the Go SDK can't be pinned to it", buildVersion)
		}
		return v, nil
	}
	if semver.IsValid(moduleVersion) && !gomodule.IsPseudoVersion(moduleVersion) && semver.Build(moduleVersion) == "" {
		return moduleVersion, nil
	}
	return latestVersion, nil
}

// requiredPersesVersion returns the version of the perses module required by the go.mod at goModPath, or an empty
// string when it doesn't exist or doesn't require perses.
func requiredPersesVersion(goModPath string) (string, error) {
	data, err := readOptionalFile(goModPath)
	if err != nil {
		return "", fmt.Errorf("could not read %q: %w", goModPath, err)
	}
	if data == nil {
		return "", nil
	}
	goMod, err := modfile.ParseLax(goModPath, data, nil)
	if err != nil {
		return "", fmt.Errorf("could not parse %q: %w", goModPath, err)
	}
	for _, r := range goMod.Require {
		if r.Mod.Path == persesModulePath {
			return r.Mod.Version, nil
		}
	}
	return "", nil
}

// readOptionalFile returns the content of the file, or nil when it doesn't exist.
func readOptionalFile(filePath string) ([]byte, error) {
	data, err := os.ReadFile(filePath) //nolint:gosec // a file of the output directory
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	return data, err
}

// ensureGoModule initializes the Go module with `go mod init` when the output directory doesn't have a go.mod yet.
// When Go sources were generated, it requires the perses module at the version of this percli build, since a plain
// `go mod tidy` would resolve the latest version, which may not match the templates. A module that already requires
// a newer perses keeps it, as `go get` would downgrade it along with the modules that depend on it. Then it runs
// `go mod tidy` for the new imports. Otherwise, a new go.mod is tidied and an existing one is left untouched. It
// returns the relative paths of go.mod and go.sum when they were created or changed.
func (o *generateOptions) ensureGoModule(modulePath string, generatedGoSources bool) ([]string, error) {
	if !o.goModuleMissing && !generatedGoSources {
		return nil, nil
	}

	ctx := o.ctx
	if ctx == nil {
		ctx = context.Background()
	}
	run := o.runGo
	if run == nil {
		run = runGo
	}

	goModPath := filepath.Join(o.outputDir, "go.mod")
	goSumPath := filepath.Join(o.outputDir, "go.sum")
	goModBefore, err := readOptionalFile(goModPath)
	if err != nil {
		return nil, fmt.Errorf("could not read the go.mod under %q: %w", o.outputDir, err)
	}
	goSumBefore, err := readOptionalFile(goSumPath)
	if err != nil {
		return nil, fmt.Errorf("could not read the go.sum under %q: %w", o.outputDir, err)
	}

	var commands [][]string
	if o.goModuleMissing {
		commands = append(commands, []string{"mod", "init", modulePath})
	}
	if generatedGoSources {
		getArgs, err := o.persesGetCommand(goModPath)
		if err != nil {
			return nil, err
		}
		if getArgs != nil {
			commands = append(commands, getArgs)
		}
	}
	commands = append(commands, []string{"mod", "tidy"})

	for i, args := range commands {
		if out, err := run(ctx, o.outputDir, args...); err != nil {
			remaining := make([]string, 0, len(commands)-i)
			for _, c := range commands[i:] {
				remaining = append(remaining, "go "+strings.Join(c, " "))
			}
			return nil, fmt.Errorf("`go %s` failed under %q: %w\n%s\n"+
				"The plugin files were generated, but the Go module isn't complete. Once the cause is fixed, run the "+
				"command again or run `%s` in %q", strings.Join(args, " "), o.outputDir, err, out,
				strings.Join(remaining, " && "), o.outputDir)
		}
	}

	var changed []string
	for _, f := range []struct {
		name   string
		path   string
		before []byte
	}{{"go.mod", goModPath, goModBefore}, {"go.sum", goSumPath, goSumBefore}} {
		after, err := readOptionalFile(f.path)
		if err != nil {
			return nil, fmt.Errorf("could not read the %s under %q: %w", f.name, o.outputDir, err)
		}
		if after != nil && !bytes.Equal(after, f.before) {
			changed = append(changed, f.name)
		}
	}
	return changed, nil
}

// persesGetCommand returns the `go get` arguments that require the perses module at the version of this percli
// build, or nil when the module already requires that version or a newer one.
func (o *generateOptions) persesGetCommand(goModPath string) ([]string, error) {
	target := o.persesVersion
	if target == "" {
		target = latestVersion
	}
	current, err := requiredPersesVersion(goModPath)
	if err != nil {
		return nil, err
	}
	if current == "" || (target != latestVersion && semver.Compare(current, target) < 0) {
		return []string{"get", persesModulePath + "@" + target}, nil
	}
	if target != latestVersion && current != target && o.errWriter != nil {
		_, _ = fmt.Fprintf(o.errWriter, "warning: the module requires %s %s, which is newer than %s the Go SDK was "+
			"generated for, so it is kept\n", persesModulePath, current, target)
	}
	return nil, nil
}

func (o *generateOptions) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *generateOptions) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

func NewCMD() *cobra.Command {
	return newCMD(runGo)
}

func newCMD(run goRunner) *cobra.Command {
	o := &generateOptions{runGo: run}
	cmd := &cobra.Command{
		Use:   "generate [<output-directory>]",
		Short: "Generate a plugin module or plugin type",
		Long: `
Creates a new plugin module if does not exist and generates a plugin inside it. 
This command can be used several times to add more plugins to the same module. 
A single plugin can be generated at a time.

For Datasource, TimeSeriesQuery, Annotation and Panel plugins, it also generates a Go SDK for Dashboard-as-Code
under sdk/go/. It then requires github.com/perses/perses at the version of percli, unless the module already
requires a newer one, and runs go mod tidy. This needs the go binary in the PATH and network access, and it
updates the go.mod and go.sum files of an existing module.
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			o.ctx = cmd.Context()
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar(&o.pluginModuleName, "module.name", "", "The plugin module name, required only when the module does not exist, ignored otherwise.")
	cmd.Flags().StringVar(&o.pluginModuleOrg, "module.org", "", "The organization name on which the plugin module will be created, useful for publising the plugin. This is required only when the module does not exist, ignored otherwise.")
	cmd.Flags().StringVar(&o.pluginName, "plugin.name", "", "The plugin name. A pascal case and kebab case variants will be generated inside the templates. If a plugin with the same name already exists, it will be overwritten.")
	cmd.Flags().StringVar(&o.pluginDisplayName, "plugin.display-name", "", "The more human name of the plugin to be used in the UI. If not provided, the plugin name will be used.")
	cmd.Flags().StringVar(&o.rawPluginType, "plugin.type", "", "The plugin type can be one of 'Datasource', 'TimeSeriesQuery', 'Variable', 'Panel', or 'Explore'.")

	return cmd
}

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

package validate

import (
	"fmt"
	"regexp"

	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/datasource"
	"github.com/perses/perses/pkg/model/api/v1/utils"
	"github.com/perses/spec/go/dashboard"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	"github.com/perses/spec/go/plugin"
)

// We want to keep only variables that are not only a number.
// A number that represents a variable is not meaningful, and so we don't want to consider it.
// It's also a way to avoid a collision in terms of variable syntax.
// For example, in PromQL, the function `label_replace` uses the syntax "$1", "$2" for the placeholders.
var variableNameRegexp = regexp.MustCompile(`^\w*?[^0-9]\w*$`)

// DashboardSpec validates the dashboard spec.
// proxyCfg is the configuration of the HTTP proxy of the server, used to validate the proxy of the local datasources.
// It can be nil when the server configuration is not known (e.g. when linting offline). The server-dependent checks are then skipped.
func DashboardSpec(spec dashboard.Spec, sch schema.Schema, proxyCfg *config.HTTPProxyConfig) error {
	if _, err := utils.BuildVariableOrder(spec.Variables, nil, nil); err != nil {
		return err
	}
	return validateDashboardSpec(spec, sch, proxyCfg)

}

// DashboardSpecWithVars is like DashboardSpec, but also takes into account the project and global variables.
func DashboardSpecWithVars(spec dashboard.Spec, sch schema.Schema, proxyCfg *config.HTTPProxyConfig, projectVariables []*modelV1.Variable, globalVariables []*modelV1.GlobalVariable) error {
	if _, err := utils.BuildVariableOrder(spec.Variables, projectVariables, globalVariables); err != nil {
		return err
	}

	return validateDashboardSpec(spec, sch, proxyCfg)
}

// Datasource validates the datasource. When list is not nil, it also verifies there is only one default datasource per kind.
// proxyCfg is the configuration of the HTTP proxy of the server, used to validate the proxy of the datasource.
// It can be nil when the server configuration is not known (e.g. when linting offline). The server-dependent checks are then skipped.
func Datasource[T modelV1.DatasourceInterface](entity T, list []T, sch schema.Schema, proxyCfg *config.HTTPProxyConfig) error {
	if err := validateDatasourcePlugin(entity.GetDatasourceSpec().Plugin, entity.GetMetadata().GetName(), sch, proxyCfg); err != nil {
		return err
	}
	if list != nil {
		return validateUnicityOfDefaultDTS(entity, list)
	}
	return nil
}

func Variable(entity modelV1.VariableInterface, sch schema.Schema) error {
	if err := validateVariableName(entity.GetMetadata().GetName()); err != nil {
		return err
	}
	return sch.ValidateGlobalVariable(entity.GetVarSpec())
}

func validateUnicityOfDefaultDTS[T modelV1.DatasourceInterface](entity T, list []T) error {
	name := entity.GetMetadata().GetName()
	spec := entity.GetDatasourceSpec()
	// Since the entity is not supposed to be a default datasource, no need to verify if there is another one already defined as default
	if !spec.Default {
		return nil
	}
	entityPluginKind := spec.Plugin.Kind
	for _, dts := range list {
		if name == dts.GetMetadata().GetName() {
			// nothing to check if comparing with same datasource
			continue
		}
		dtsSpec := dts.GetDatasourceSpec()
		if dtsSpec.Default && dtsSpec.Plugin.Kind == entityPluginKind {
			return fmt.Errorf("datasource %q cannot be a default %q because there is already one defined named %q", entity.GetMetadata().GetName(), entityPluginKind, dts.GetMetadata().GetName())
		}
	}
	return nil
}

func validateVariableName(variable string) error {
	valid := variableNameRegexp.MatchString(variable)
	if !valid {
		return fmt.Errorf("variable name '%s' is not valid", variable)
	}

	// Checking if the variable does not have builtin variable prefix: __
	isBuiltinVar := modelV1.IsBuiltinVariable(variable)
	if isBuiltinVar {
		return fmt.Errorf("variable name '%s' can not have builtin variable prefix: __", variable)
	}
	return nil
}

func validateVariableNames(variables []dashboard.Variable) error {
	for _, variable := range variables {
		if err := validateVariableName(variable.Spec.GetName()); err != nil {
			return err
		}
	}
	return nil
}

func validateDatasourcePlugin(plugin plugin.Plugin, name string, sch schema.Schema, proxyCfg *config.HTTPProxyConfig) error {
	proxyConfig, _, err := datasource.ValidateAndExtract(plugin.Spec)
	if err != nil {
		return err
	}
	if err := validateHTTPProxyTimeout(proxyConfig, name, proxyCfg); err != nil {
		return err
	}
	return sch.ValidateDatasource(plugin, name)
}

// validateHTTPProxyTimeout verifies the timeout of the HTTP proxy of the datasource, if any, is allowed by the server configuration.
// A datasource can only lower the timeout set by the server, so any value beyond the maximum is rejected.
// The verification is skipped when proxyCfg is nil (server configuration unknown), or when the datasource doesn't use an HTTP proxy.
func validateHTTPProxyTimeout(proxyConfig any, name string, proxyCfg *config.HTTPProxyConfig) error {
	if proxyCfg == nil {
		return nil
	}
	httpConfig, ok := proxyConfig.(*datasourceHTTP.Config)
	if !ok || httpConfig == nil {
		return nil
	}
	if err := proxyCfg.ValidateTimeout(httpConfig.Timeout); err != nil {
		return fmt.Errorf("invalid proxy of the datasource %q: %w", name, err)
	}
	return nil
}

func validateDashboardSpec(spec dashboard.Spec, sch schema.Schema, proxyCfg *config.HTTPProxyConfig) error {
	if err := validateVariableNames(spec.Variables); err != nil {
		return err
	}

	if sch != nil {
		if err := sch.ValidateDashboardVariables(spec.Variables); err != nil {
			return err
		}
		if err := sch.ValidateDashboardAnnotations(spec.Annotations); err != nil {
			return err
		}
		if err := sch.ValidatePanels(spec.Panels); err != nil {
			return err
		}
	}
	if len(spec.Datasources) > 0 {
		defaultDts := make(map[string]bool)
		for dtsName, dtsSpec := range spec.Datasources {
			if err := validateDatasourcePlugin(dtsSpec.Plugin, dtsName, sch, proxyCfg); err != nil {
				return err
			}
			if dtsSpec.Default {
				if defaultDts[dtsSpec.Plugin.Kind] {
					return fmt.Errorf("%s can not be defined as default datasource: there is already a default defined for kind %q", dtsName, dtsSpec.Plugin.Kind)
				}
				defaultDts[dtsSpec.Plugin.Kind] = true
			}
		}
	}
	return nil
}

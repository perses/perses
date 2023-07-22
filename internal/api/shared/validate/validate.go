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

package validate

import (
	"fmt"

	"github.com/perses/perses/internal/api/shared/schemas"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/perses/perses/pkg/model/api/v1/utils"
)

func Dashboard(entity *modelV1.Dashboard, sch schemas.Schemas) error {
	if _, err := utils.BuildVariableOrder(entity.Spec.Variables, nil, nil); err != nil {
		return err
	}
	return validateDashboard(entity, sch)

}

func DashboardWithVars(entity *modelV1.Dashboard, sch schemas.Schemas, projectVariables []*modelV1.Variable, globalVariables []*modelV1.GlobalVariable) error {
	if _, err := utils.BuildVariableOrder(entity.Spec.Variables, projectVariables, globalVariables); err != nil {
		return err
	}

	return validateDashboard(entity, sch)
}

func Datasource[T modelV1.DatasourceInterface](entity T, list []T, sch schemas.Schemas) error {
	if err := validateDTSPlugin(entity.GetDTSSpec().Plugin, sch); err != nil {
		return err
	}
	if list != nil {
		if err := validateUnicityOfDefaultDTS(entity, list); err != nil {
			return err
		}
	}
	return nil
}

func validateUnicityOfDefaultDTS[T modelV1.DatasourceInterface](entity T, list []T) error {
	name := entity.GetMetadata().GetName()
	spec := entity.GetDTSSpec()
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
		dtsSpec := dts.GetDTSSpec()
		if dtsSpec.Default && dtsSpec.Plugin.Kind == entityPluginKind {
			return fmt.Errorf("datasource %q cannot be a default %q because there is already one defined named %q", entity.GetMetadata().GetName(), entityPluginKind, dts.GetMetadata().GetName())
		}
	}
	return nil
}

func validateDTSPlugin(plugin common.Plugin, sch schemas.Schemas) error {
	if _, err := http.ValidateAndExtract(plugin.Spec); err != nil {
		return err
	}
	return sch.ValidateDatasource(plugin)
}

func validateDashboard(entity *modelV1.Dashboard, sch schemas.Schemas) error {
	if sch != nil {
		if err := sch.ValidateDashboardVariables(entity.Spec.Variables); err != nil {
			return err
		}
		if err := sch.ValidatePanels(entity.Spec.Panels); err != nil {
			return err
		}
	}
	if len(entity.Spec.Datasources) > 0 {
		defaultDTS := make(map[string]bool)
		for _, spec := range entity.Spec.Datasources {
			if err := validateDTSPlugin(spec.Plugin, sch); err != nil {
				return err
			}
			if spec.Default {
				if defaultDTS[spec.Plugin.Kind] {
					return fmt.Errorf("there is already a default datasource defined for the kind %q", spec.Plugin.Kind)
				}
				defaultDTS[spec.Plugin.Kind] = true
			}
		}
	}
	return nil
}

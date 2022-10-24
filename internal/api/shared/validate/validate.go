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

package validate

import (
	"fmt"

	"github.com/perses/perses/internal/api/shared/schemas"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
)

func Dashboard(entity *modelV1.Dashboard, sch schemas.Schemas) error {
	if _, err := dashboard.BuildVariableOrder(entity.Spec.Variables); err != nil {
		return err
	}
	if sch != nil {
		if err := sch.ValidateVariables(entity.Spec.Variables); err != nil {
			return err
		}
		if err := sch.ValidatePanels(entity.Spec.Panels); err != nil {
			return err
		}
	}

	return nil
}

func Datasource[T modelV1.DatasourceInterface](entity T, list []T, sch schemas.Schemas) error {
	plugin := entity.GetDTSSpec().Plugin
	if _, err := http.ValidateAndExtract(plugin.Spec); err != nil {
		return err
	}
	if list != nil {
		if err := validateUnicityOfDefaultDTS(entity, list); err != nil {
			return err
		}
	}
	if sch != nil {
		return sch.ValidateDatasource(plugin)
	}
	return nil
}

func validateUnicityOfDefaultDTS[T modelV1.DatasourceInterface](entity T, list []T) error {
	spec := entity.GetDTSSpec()
	// Since the entity is not supposed to be a default datasource, no need to verify if there is another one already defined as default
	if !spec.Default {
		return nil
	}
	entityPluginKind := spec.Plugin.Kind
	for _, dts := range list {
		dtsSpec := dts.GetDTSSpec()
		if dtsSpec.Default && dtsSpec.Plugin.Kind == entityPluginKind {
			return fmt.Errorf("datasource %q cannot be a default %q because there is already one defined named %q", entity.GetMetadata().GetName(), entityPluginKind, dts.GetMetadata().GetName())
		}
	}
	return nil
}

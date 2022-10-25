// Copyright 2021 The Perses Authors
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

package shared

import (
	"fmt"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/sirupsen/logrus"
)

const (
	ParamName            = "name"
	ParamProject         = "project"
	APIV1Prefix          = "/api/v1"
	PathDashboard        = "dashboards"
	PathDatasource       = "datasources"
	PathFolder           = "folders"
	PathGlobalDatasource = "globaldatasources"
	PathProject          = "projects"
	PathUser             = "users"
)

// ProjectResourcePathList is containing the list of the resource path that are part of a project.
var ProjectResourcePathList = []string{
	PathDashboard, PathDatasource, PathFolder,
}

func getNameParameter(ctx echo.Context) string {
	return ctx.Param(ParamName)
}

func GetProjectParameter(ctx echo.Context) string {
	return ctx.Param(ParamProject)
}

// validateMetadataVersusParameter is the generic method used to validate provided metadata against the parameters in the context
//   - If the parameter in the context is empty, no checks are performed => OK
//   - Else
//   - If metadata value is empty, it is overridden with the context value => OK
//   - Else
//   - If the values are not matching return an error => KO
//   - Else => OK
func validateMetadataVersusParameter(ctx echo.Context, paramName string, metadataValue *string) error {
	paramValue := ctx.Param(paramName)
	if len(paramValue) > 0 {
		if len(*metadataValue) <= 0 {
			logrus.Debugf("overridden empty metadata value with %s parameter value '%s'", paramName, paramValue)
			*metadataValue = paramValue
		} else if *metadataValue != paramValue {
			return fmt.Errorf("%s parameter value '%s' does not match provided metadata value '%s'", paramName, paramValue, *metadataValue)
		}
	}
	return nil
}

func validateMetadata(ctx echo.Context, metadata api.Metadata) error {
	if err := common.ValidateID(metadata.GetName()); err != nil {
		return err
	}
	switch met := metadata.(type) {
	case *v1.ProjectMetadata:
		if err := validateMetadataVersusParameter(ctx, ParamProject, &met.Project); err != nil {
			return err
		}
	}
	return nil
}

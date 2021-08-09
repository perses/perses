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
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

const (
	ParamName          = "name"
	ParamProject       = "project"
	APIV1Prefix        = "/api/v1"
	PathDashboard      = "dashboards"
	PathDatasource     = "datasources"
	PathProject        = "projects"
	PathPrometheusRule = "prometheusrules"
	PathUser           = "users"
)

func getNameParameter(ctx echo.Context) string {
	return ctx.Param(ParamName)
}

func getProjectParameter(ctx echo.Context) string {
	return ctx.Param(ParamProject)
}

func validateMetadata(metadata interface{}) error {
	switch met := metadata.(type) {
	case *v1.ProjectMetadata:
		if len(met.Project) == 0 {
			return fmt.Errorf("metadata.project cannot be empty")
		}
		if len(met.Name) == 0 {
			return fmt.Errorf("metadata.name cannot be empty")
		}
	case *v1.Metadata:
		if len(met.Name) == 0 {
			return fmt.Errorf("metadata.name cannot be empty")
		}
	}
	return nil
}
